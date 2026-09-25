#!/usr/bin/env bash
# TiAmo 前端部署脚本
#
# 固化顺序（任何一步失败立即中止，线上不受影响；上线后失败自动回滚）：
#   1 预检   node/磁盘/两个仓库工作区是否干净、是否落后于 origin
#   2 同步   tiamo-vue3/src → TiAmo/frontend/src（聚合仓库镜像，根治"镜像漂移"）
#   3 构建   vite build
#   4 回归   对 dist 跑 check-nav-regression.sh（构建产物有问题不上线）
#   5 上线   备份现有站点目录，原子替换
#   6 校验   对部署目录再跑一次回归 + HTTP 实测；失败自动回滚到备份
#   7 提交   TiAmo 仓库 commit + push（前端源码仓库需你自己先提交）
#
# 用法：
#   deploy-frontend.sh              # 完整部署
#   deploy-frontend.sh --dry-run    # 只同步+构建+回归，不碰线上、不提交
#   deploy-frontend.sh --no-git     # 部署但不提交推送
#   deploy-frontend.sh --allow-dirty# 允许源码仓库有未提交改动（默认拒绝）
#
# 为什么默认拒绝脏工作区：今晚的镜像落后就是因为源码改了没提交，
# 部署却先把产物推上线，两个仓库就此分叉。卡住这一步才不会再发生。
set -euo pipefail

SELF="$(readlink -f "$0" 2>/dev/null || printf '%s' "$0")"
FRONT="${FRONT_SRC:-/opt/tiamo/tiamo-vue3}"          # 前端源码（唯一可构建处）
MIRROR="${MIRROR:-/opt/tiamo/TiAmo/frontend}"        # 聚合仓库里的 frontend 镜像
MIRROR_REPO="$(cd "$MIRROR/.." && pwd)"              # TiAmo 仓库根
WEB="${WEB:-/opt/tiamo/frontend}"                    # nginx 站点根
SITE="${SITE:-https://tiamozf.icu}"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOGDIR="${LOGDIR:-/opt/tiamo/logs}"
BACKUP="$WEB.bak-deploy-$STAMP-$$"
DRY=0; ALLOW_DIRTY=0; SKIP_GIT=0
for a in "$@"; do case "$a" in
  --dry-run) DRY=1 ;; --no-git) SKIP_GIT=1 ;; --allow-dirty) ALLOW_DIRTY=1 ;;
  *) echo "未知参数：$a"; exit 2 ;;
esac; done

mkdir -p "$LOGDIR"
LOG="$LOGDIR/deploy-frontend-$STAMP.log"
# 进程替换，单实例。不要用 `exec bash $SELF | tee`：管道下 exec 不替换当前 shell，
# 父进程会 fork 子进程后继续往下跑，造成同一部署并发执行两遍。
exec > >(tee -a "$LOG") 2>&1

step() { printf '\n=== %s ===\n' "$*"; }
die()  { printf '\n中止：%s\n（线上未改动，日志 %s）\n' "$*" "$LOG"; exit 1; }
run()  { printf '+ %s\n' "$*"; "$@"; }

step "0. 环境"
command -v node >/dev/null || die "找不到 node"
printf 'node %s / npm %s\n' "$(node -v)" "$(npm -v)"
AVAIL_KB=$(df -Pk "$FRONT" | awk 'NR==2{print $4}')
[ "$AVAIL_KB" -gt 512000 ] || die "磁盘剩余不足 500MB：${AVAIL_KB}KB"
printf '磁盘剩余 %s MB\n' "$((AVAIL_KB/1024))"
[ -d "$FRONT/src" ] || die "前端源码目录不存在：$FRONT/src"
[ -d "$MIRROR" ] || die "镜像目录不存在：$MIRROR"
[ -f "$FRONT/scripts/check-nav-regression.sh" ] || die "缺少回归脚本"

step "1. 预检：仓库状态"
for r in "$FRONT" "$MIRROR_REPO"; do
  cd "$r"
  git fetch -q origin 2>/dev/null || die "git fetch 失败：$r（网络/凭据？）"
  BR=$(git rev-parse --abbrev-ref HEAD)
  BEHIND=$(git rev-list --count "HEAD..origin/$BR" 2>/dev/null || echo 0)
  [ "$BEHIND" = "0" ] || die "$r 落后 origin/$BR $BEHIND 个提交，请先 pull 再部署"
  if [ "$r" = "$MIRROR_REPO" ]; then
    # frontend/ 内的改动是本脚本第 7 步要提交的内容，不算脏；其余位置才需要人工处理
    OUT=$(git status --porcelain -- . ':!frontend' | wc -l)
    IN=$(git status --porcelain -- frontend | wc -l)
    printf '%s [%s] 镜像外 %d 项，frontend/ 内 %d 项（后者将由本脚本提交）\n' \
      "$(basename "$r")" "$BR" "$OUT" "$IN"
    if [ "$OUT" != "0" ]; then
      git status --porcelain -- . ':!frontend' | head -8
      die "$r 在 frontend/ 之外有未提交改动，请先自行处理"
    fi
    [ "$IN" = "0" ] || git status --porcelain -- frontend | head -5
    continue
  fi
  DIRTY=$(git status --porcelain | wc -l)
  printf '%s [%s] 未提交改动 %d 项\n' "$(basename "$r")" "$BR" "$DIRTY"
  if [ "$DIRTY" != "0" ] && [ "$ALLOW_DIRTY" = "0" ]; then
    git status --short | head -8
    die "$r 工作区不干净。请先提交，或明确使用 --allow-dirty"
  fi
done
cd "$FRONT"

step "2. 同步聚合仓库镜像"
# 权限归一化为 644/755：源码目录有历史遗留的 755，直接 cp -a 会把模式带进镜像，
# 让 TiAmo 出现纯权限的"已修改"，预检因此误判
RSYNC_FLAGS="-rlpt --no-perms --chmod=F644,D755 --omit-dir-times --delete"
if [ "$DRY" = "1" ]; then
  # 预演不写镜像：否则脚本会把自己弄脏的工作区留给下一次预检判罚
  if command -v rsync >/dev/null 2>&1; then
    run rsync $RSYNC_FLAGS --dry-run --itemize-changes "$FRONT/src/" "$MIRROR/src/" \
      | tee "$LOGDIR/.mirror-itemize-$STAMP.txt" >/dev/null
    N=$(grep -c "." "$LOGDIR/.mirror-itemize-$STAMP.txt" || true)
    printf '预演：镜像将更新 %s 个文件（未写入）\n' "$N"
  else
    printf '预演：未安装 rsync，跳过镜像差异报告\n'
  fi
else
  if command -v rsync >/dev/null 2>&1; then
    run rsync $RSYNC_FLAGS "$FRONT/src/" "$MIRROR/src/"
  else
    rm -rf "$MIRROR/src"; mkdir -p "$MIRROR/src"
    (cd "$FRONT" && find src -type f | cpio -pmdu "$MIRROR/") >/dev/null 2>&1
  fi
  # 构建配置一并跟随，避免镜像里的 index.html / package.json 落后
  for f in index.html package.json vite.config.js; do
    [ -f "$FRONT/$f" ] && cp -f "$FRONT/$f" "$MIRROR/$f" 2>/dev/null || true
  done
  # 上一轮 cp -a 已把 755 带进镜像根文件，cp -f 不改权限，这里显式归一
  find "$MIRROR" -maxdepth 1 -type f -exec chmod 644 {} + 2>/dev/null || true
  mkdir -p "$MIRROR/scripts"
  for s in "$FRONT"/scripts/*.sh; do
    [ -f "$s" ] && cp -f "$s" "$MIRROR/scripts/" 2>/dev/null || true
  done
  chmod 755 "$MIRROR"/scripts/*.sh 2>/dev/null || true
  CHANGED=$(diff -rq "$FRONT/src" "$MIRROR/src" 2>/dev/null | grep -c "^Files" || true)
  printf '镜像同步完成，仍有内容差异的文件：%s\n' "$CHANGED"
fi

step "3. 构建"
run npm run build 2>&1 | tail -4 || die "构建失败，未触碰线上"
[ -f "$FRONT/dist/index.html" ] || die "构建未产出 dist/index.html"

step "4. 回归检查（对 dist）"
QW_SRC="$FRONT/src" QW_WEB="$FRONT/dist" bash "$FRONT/scripts/check-nav-regression.sh" \
  || die "构建产物未通过回归检查，不上线"

if [ "$DRY" = "1" ]; then
  step "预演结束（--dry-run）：未替换线上文件、未提交"
  exit 0
fi

step "5. 备份并原子上线"
run cp -a "$WEB" "$BACKUP"
# 先拷到站点同分区的暂存目录：dist 保持完整（第 6 步还要拿它比对），
# 而入口文件的 mv 是同分区 rename，原子生效
TMPT="/opt/tiamo/.deploy-stage-$STAMP"
rm -rf "$TMPT"; cp -a "$FRONT/dist" "$TMPT"; trap 'rm -rf "$TMPT"' EXIT
# 1) 新 chunk 先并入：新旧同时在场，切换前任何已缓存页面都能取到文件
mkdir -p "$WEB/assets"
run cp -a "$TMPT/assets/." "$WEB/assets/"
# 2) 入口用 rename 原子替换，这一刻起新 chunk 已全部就位
for f in "$TMPT"/*; do
  case "$f" in *.html|*.json|*.txt) mv -f "$f" "$WEB"/ ;; esac
done
# 3) 清理不再被新入口引用的旧产物（只动 assets，保留 .well-known 等站点自有文件）
STALE=0
for f in $(ls "$WEB/assets" 2>/dev/null); do
  [ -f "$FRONT/dist/assets/$f" ] || { rm -f "$WEB/assets/$f"; STALE=$((STALE+1)); }
done
rm -rf "$TMPT"
printf '上线完成：站点根 %s，清理旧产物 %d 个，备份 %s\n' "$WEB" "$STALE" "$BACKUP"

rollback() {
  step "回滚到 $BACKUP"
  rm -rf "$WEB".rolling && cp -a "$BACKUP" "$WEB".rolling \
    && mv "$WEB" "$WEB".failed-$STAMP && mv "$WEB".rolling "$WEB"
  printf '已回滚，线上恢复为部署前状态\n'
}

step "6. 线上校验"
OK=1
QW_SRC="$FRONT/src" QW_WEB="$WEB" bash "$FRONT/scripts/check-nav-regression.sh" || OK=0
ENTRY=$(grep -o 'index-[A-Za-z0-9_.-]*\.js' "$WEB/index.html" | head -1)
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$SITE/")
printf '首页 http %s，入口 %s\n' "$CODE" "$ENTRY"
[ "$CODE" = "200" ] || { printf '首页未返回 200\n'; OK=0; }
RC=$(curl -s -o /dev/null -w '%{http_code}' "$SITE/assets/$ENTRY")
[ "$RC" = "200" ] || { printf '入口 chunk 未返回 200（http %s）\n' "$RC"; OK=0; }
curl -s "$SITE/assets/$ENTRY" | grep -q "check-init" \
  || { printf '入口 chunk 缺少守卫逻辑\n'; OK=0; }
BN=$(ls "$WEB"/assets/BottomNav-*.js 2>/dev/null | head -1)
if [ -n "$BN" ]; then
  curl -s "$SITE/assets/$(basename "$BN")" | grep -q "/profile" \
    || { printf '线上 BottomNav 缺少 /profile\n'; OK=0; }
fi
if [ "$OK" = "0" ]; then rollback; die "线上校验未通过，已自动回滚"; fi

step "7. 提交聚合仓库"
BNF="none"; [ -n "$BN" ] && BNF="$(basename "$BN")"
if [ "$SKIP_GIT" = "1" ]; then
  printf '按 --no-git 跳过\n'
else
  cd "$MIRROR_REPO"
  if [ -n "$(git status --porcelain)" ]; then
    git add -A frontend
    git commit -q -F - <<MSG
deploy: 前端上线 $STAMP（$BNF、$ENTRY）

由 scripts/deploy-frontend.sh 在部署成功后自动同步 frontend 镜像。
站点根 $WEB，备份 $BACKUP，日志 $LOG
MSG
    git push -q origin main 2>&1 | tail -2 || die "TiAmo 推送失败，改动已本地提交待人工处理"
    printf 'TiAmo 已提交推送：%s\n' "$(git rev-parse --short HEAD)"
  else
    printf 'TiAmo 镜像无变化，无需提交\n'
  fi
fi

step "完成"
printf '线上入口 %s，日志 %s\n' "$ENTRY" "$LOG"
printf '回滚命令（如需）：rm -rf %s && cp -a %s %s\n' "$WEB" "$BACKUP" "$WEB"
