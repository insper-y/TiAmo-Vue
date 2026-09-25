#!/usr/bin/env bash
# 底部导航 + 备案号排版 回归检查 v4
#
# 覆盖两类历史事故：
#  A) Logs / RunLog / Settings 各自实现 onNav 却漏掉 me 分支
#     → 移动端点"我的"完全不跳转、也不报错（线上产物验证：Logs chunk 内 profile 出现 0 次）
#  B) 补丁脚本按文件重复读写，后写覆盖先写
#     → 守卫调用了未定义的函数、视图用到了未导入的 auth；vite 构建不报错但页面白屏
#     故这里强制"引用必须先定义/导入"。
#  C) 备案号用 position:fixed 贴在移动端底部 → 长内容页滚动时被浮层遮挡，已回退为正常文档流
#
# 用法：
#   bash scripts/check-nav-regression.sh          # 在仓库里跑，只查源码
#   QW_WEB=/opt/tiamo/frontend bash scripts/check-nav-regression.sh   # 连带核对线上产物
set -uo pipefail

# 先解析软链：服务器上的 /opt/tiamo/check-nav-regression.sh 是指向本文件的软链，
# 不解析会把仓库根算成软链所在目录
SELF="$(readlink -f "$0" 2>/dev/null || printf '%s' "$0")"
REPO="$(cd "$(dirname "$SELF")/.." && pwd)"
SRC="${QW_SRC:-$REPO/src}"
WEB="${QW_WEB:-/opt/tiamo/frontend}"
FAIL=0

chk() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then printf 'PASS  %s\n' "$desc"
  else printf 'FAIL  %s\n' "$desc"; FAIL=1; fi
}
# 只查真实源文件，忽略 .bak-* 备份
srcviews() { find "$SRC/views" -name '*.vue' ! -name '*.vue.bak*'; }

[ -d "$SRC" ] || { echo "找不到源码目录：$SRC"; exit 2; }

# ---------- A. 跳转逻辑集中在组件 ----------
chk "BottomNav.vue 含 me -> /profile" \
  grep -Eq "me *: *['\"]/profile['\"]" "$SRC/components/BottomNav.vue"
chk "BottomNav.vue 含 logs / runlog 映射" \
  bash -c "grep -q \"logs: *'/logs'\" $SRC/components/BottomNav.vue && grep -q \"runlog: *'/run-log'\" $SRC/components/BottomNav.vue"
chk "BottomNav.vue 同路径不重复跳转" \
  grep -q "route.path !== target" "$SRC/components/BottomNav.vue"

# ---------- B. 权限真实传入，引用即须定义 ----------
chk '无视图把 :is-admin 写死为 true' \
  bash -c "! grep -rE --include='*.vue' ':is-admin=\"true\"' $SRC/views | grep -q ."

NV=0
while IFS= read -r f; do
  grep -q '<BottomNav' "$f" || continue
  base=$(basename "$f"); NV=$((NV + 1))
  grep -q ':is-admin="isAdmin"' "$f" || { echo "FAIL  $base 未传真实 :is-admin"; FAIL=1; continue; }
  chk "$base :is-admin / :permissions 已传真实值" \
    grep -q ':is-admin="isAdmin"[^>]*:permissions="userPermissions"' "$f"
  chk "$base 定义了 isAdmin"        grep -q 'const isAdmin *=' "$f"
  chk "$base 定义了 userPermissions" grep -q 'const userPermissions *=' "$f"
  chk "$base 导入了 auth"            grep -Eq "import \{[^}]*\bauth\b" "$f"
  chk "$base 导入了 computed"        grep -Eq "import \{[^}]*\bcomputed\b" "$f"
done < <(srcviews)
chk "使用 BottomNav 的视图数量 >= 5（含 Profile）" \
  bash -c "[ $NV -ge 5 ]"

# ---------- C. 守卫与工具 ----------
chk "utils 提供 getPermissions" grep -q 'getPermissions:' "$SRC/utils/index.js"
if grep -q 'await checkInitialized()' "$SRC/router/index.js"; then
  chk "router 定义了 checkInitialized" grep -q 'const checkInitialized' "$SRC/router/index.js"
  chk "check-init 探测带超时"          grep -q 'AbortController' "$SRC/router/index.js"
fi
chk "探测请求只在守卫里出现一处" \
  bash -c "[ $(grep -c 'check-init' $SRC/router/index.js) -eq 1 ]"

# ---------- D. 备案号排版 ----------
chk "App.vue 含 .icp-footer 样式" grep -q '\.icp-footer' "$SRC/App.vue"
chk "备案号不用 position:fixed（会遮挡长页内容）" \
  bash -c "! grep -A 12 '\.icp-footer {' $SRC/App.vue | grep -q 'position: *fixed'"
chk "视图让位高度已收敛到 footer" grep -q '#app > \*:not(\.icp-footer)' "$SRC/App.vue"

# ---------- E. 线上产物（仅当部署目录存在时）----------
if [ -d "$WEB/assets" ]; then
  BN=$(ls "$WEB"/assets/BottomNav-*.js 2>/dev/null | head -1)
  if [ -n "${BN:-}" ]; then
    chk "线上 $(basename "$BN") 含 /profile" grep -q "/profile" "$BN"
  else
    echo "FAIL  线上无 BottomNav chunk"; FAIL=1
  fi
  for v in Logs RunLog Settings Dashboard Profile; do
    C=$(ls "$WEB"/assets/$v-*.js 2>/dev/null | head -1)
    [ -n "${C:-}" ] || { echo "FAIL  线上缺 $v chunk"; FAIL=1; continue; }
    chk "$v chunk 引用 $(basename "${BN:-none}")" grep -q "$(basename "$BN" .js)" "$C"
  done
  if [ -d "$REPO/dist/assets" ]; then
    chk "dist 与部署目录完全一致" diff -rq "$REPO/dist/assets" "$WEB/assets"
  fi
else
  echo "SKIP  未找到部署目录 $WEB，跳过线上产物核对（本地只查源码）"
fi

echo "-----"
[ $FAIL -eq 0 ] && echo "结果：全部通过" || echo "结果：存在失败项"
exit $FAIL
