<template>
  <div class="dashboard">
    <!-- 顶部导航 -->
    <AppHeader :show-back="activeTab !== 'home'" @back="setTab('home')" />

    <!-- 图片/视频放大预览 -->
    <div v-if="previewImg" class="img-preview-overlay" @click="closePreview">
      <img :src="previewImg" class="img-preview" @click.stop />
      <button class="img-preview-del" @click.stop="deleteFromPreview">删除</button>
      <button class="img-preview-close" @click="closePreview">×</button>
    </div>
    <div v-if="previewVideo" class="img-preview-overlay" @click="closePreview">
      <video :src="previewVideo" class="video-preview" controls autoplay @click.stop></video>
      <button class="img-preview-del" @click.stop="deleteFromPreview">删除</button>
      <button class="img-preview-close" @click="closePreview">×</button>
    </div>

    <!-- 内容区 -->
    <main class="content pc-wrap">
      <!-- 首页 -->
      <div v-if="activeTab === 'home'" class="home-view">
        <div class="welcome-card">
          <div class="welcome-text">
            <h2>{{ greeting }}，{{ user?.username }} 👋</h2>
            <p>欢迎回到 TiAmo 数据管理平台</p>
          </div>
          <div class="welcome-date">{{ currentDate }}</div>
        </div>

        <div class="section-title">常用功能</div>
        <div class="function-grid">
          <div
            v-for="func in quickFunctions"
            :key="func.key"
            class="function-item"
            @click="openFunction(func)"
          >
            <div class="function-icon" :style="{ background: func.bg }">{{ func.icon }}</div>
            <span class="function-name">{{ func.name }}</span>
          </div>
        </div>

        <div class="section-title" v-if="isAdmin">最近活动</div>
        <div class="recent-list" v-if="isAdmin">
          <div v-if="recentLogs.length === 0" class="empty-state">暂无活动记录</div>
          <div v-for="log in recentLogs" :key="log.id" class="recent-item">
            <div class="recent-dot" :class="log.status === '成功' ? 'success' : 'error'"></div>
            <div class="recent-info">
              <span class="recent-action">{{ log.operation }}</span>
              <span class="recent-time">{{ fmtShort(log.createTime) }}</span>
            </div>
            <span class="recent-module">{{ log.module }}</span>
          </div>
        </div>
      </div>

      <!-- 用户列表 -->
      <div v-if="activeTab === 'users'" class="users-view">
        <div class="view-header">
          <h3>用户管理</h3>
          <button class="btn-primary btn-sm" @click="generateInviteCode">生成邀请码</button>
        </div>
        <div class="filter-bar">
          <input v-model="userSearch" class="input" placeholder="搜索用户名/邮箱" @keyup.enter="loadUsers" />
          <button class="btn" @click="loadUsers">搜索</button>
        </div>
        <!-- 桌面端：用户列表用真表格 -->
        <div class="pc-only pc-scroll">
          <table class="pc-table">
            <thead>
              <tr><th>ID</th><th>用户名</th><th>昵称</th><th>邮箱</th><th>角色</th><th>状态</th><th>注册时间</th><th class="wrap">操作</th></tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td class="num">{{ u.id }}</td>
                <td class="mono">{{ u.username }}</td>
                <td>{{ u.nickname || '-' }}</td>
                <td class="mono">{{ u.email || '-' }}</td>
                <td><span class="u-role" :class="u.role === 1 ? 'u-admin' : 'u-user'">{{ u.role === 1 ? '管理员' : '普通用户' }}</span></td>
                <td :style="{color: u.status === 1 ? '#059669' : '#dc2626'}">{{ u.status === 1 ? '正常' : '禁用' }}</td>
                <td class="mono muted">{{ fmtShort(u.createTime) }}</td>
                <td class="ops">
                  <button class="btn btn-sm" @click="toggleUserStatus(u)">{{ u.status === 1 ? '禁用' : '启用' }}</button>
                  <button class="btn btn-sm" @click="toggleUserRole(u)">{{ u.role === 1 ? '降为用户' : '升为管理员' }}</button>
                  <button v-if="u.role !== 1" class="btn btn-sm" @click="openPermModal(u)">权限设置</button>
                  <button class="btn btn-sm btn-danger" @click="deleteUser(u)">删除</button>
                </td>
              </tr>
              <tr v-if="users.length === 0"><td colspan="8" class="pc-table-empty">暂无用户</td></tr>
            </tbody>
          </table>
        </div>
        <div class="mobile-card-list mob-only">
          <div v-if="users.length === 0" class="empty-state">暂无用户</div>
          <div v-for="u in users" :key="u.id" class="mobile-card">
            <div class="mobile-card-header">
              <div class="mobile-card-title">{{ u.nickname || u.username }}</div>
              <span class="mobile-card-badge" :class="u.role === 1 ? 'admin' : 'user'">
                {{ u.role === 1 ? '管理员' : '普通用户' }}
              </span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span class="label">用户名</span><span class="value">{{ u.username }}</span></div>
              <div class="mobile-card-row"><span class="label">邮箱</span><span class="value">{{ u.email }}</span></div>
              <div class="mobile-card-row"><span class="label">状态</span><span class="value" :style="{color: u.status === 1 ? '#059669' : '#dc2626'}">{{ u.status === 1 ? '正常' : '禁用' }}</span></div>
              <div class="mobile-card-row"><span class="label">注册时间</span><span class="value">{{ u.createTime }}</span></div>
            </div>
            <div class="mobile-card-footer">
              <button class="btn" @click="toggleUserStatus(u)">{{ u.status === 1 ? '禁用' : '启用' }}</button>
              <button class="btn" @click="toggleUserRole(u)">{{ u.role === 1 ? '降为用户' : '升为管理员' }}</button>
              <button v-if="u.role !== 1" class="btn" @click="openPermModal(u)">权限设置</button>
              <button class="btn btn-danger" @click="deleteUser(u)">删除</button>
            </div>
          </div>
        </div>
      </div>


      <!-- 权限设置弹窗 -->
      <div v-if="permModalVisible" class="modal-overlay" @click.self="permModalVisible = false">
        <div class="modal-content" style="max-width:400px;width:90%;">
          <div class="modal-header">
            <h3>🔐 权限设置 - {{ permTargetUser?.username }}</h3>
            <button class="modal-close" @click="permModalVisible = false">×</button>
          </div>
          <div class="modal-body">
            <p style="color:#666;margin-bottom:16px;font-size:14px;">勾选要分配给该用户的权限：</p>
            <div class="perm-list">
              <label v-for="p in assignablePerms" :key="p.key" class="perm-item">
                <input type="checkbox" :value="p.key" v-model="selectedPerms" />
                <span class="perm-icon">{{ p.icon }}</span>
                <span class="perm-text">{{ p.name }}</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="permModalVisible = false">取消</button>
            <button class="btn-primary" @click="savePermissions" :disabled="permSaving">{{ permSaving ? '保存中…' : '保存权限' }}</button>
          </div>
        </div>
      </div>

      <!-- 表结构弹窗 -->
      <div v-if="structureModalVisible" class="modal-overlay" @click.self="structureModalVisible = false">
        <div class="modal-content" style="max-width:520px;width:92%;max-height:80vh;display:flex;flex-direction:column;">
          <div class="modal-header">
            <h3>🗄️ {{ structureTableName }} 表结构</h3>
            <button class="modal-close" @click="structureModalVisible = false">×</button>
          </div>
          <div class="modal-body" style="overflow-y:auto;">
            <div class="section-title" style="margin:0 0 8px;">字段</div>
            <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">
              <tr style="background:#f1f5f9;">
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">#</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">字段名</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">类型</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">可空</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">键</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">默认值</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">注释</th>
              </tr>
              <tr v-for="c in structureColumns" :key="c.columnName">
                <td style="padding:6px 8px;border:1px solid #e2e8f0;color:#94a3b8;">{{ c.position }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:600;">{{ c.columnName }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">{{ c.columnType }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">{{ c.nullable === 'YES' ? '是' : '否' }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">{{ c.columnKey || '-' }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">{{ c.defaultValue == null ? '-' : c.defaultValue }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">{{ c.comment || '-' }}</td>
              </tr>
            </table>
            <div class="section-title" v-if="structureIndexes.length > 0" style="margin:0 0 8px;">索引</div>
            <table v-if="structureIndexes.length > 0" style="width:100%;font-size:12px;border-collapse:collapse;">
              <tr style="background:#f1f5f9;">
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">索引名</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">字段</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">唯一</th>
                <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">类型</th>
              </tr>
              <tr v-for="ix in structureIndexes" :key="ix.indexName + ix.seqInIndex">
                <td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:600;">{{ ix.indexName }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">{{ ix.columnName }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">{{ ix.nonUnique === 0 ? '是' : '否' }}</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">{{ ix.indexType }}</td>
              </tr>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="structureModalVisible = false">关闭</button>
          </div>
        </div>
      </div>

      <!-- 表数据弹窗 -->
      <div v-if="dataModalVisible" class="modal-overlay" @click.self="closeTableData">
        <div class="modal-content" style="max-width:860px;width:95%;max-height:86vh;display:flex;flex-direction:column;">
          <div class="modal-header">
            <h3>🗄️ {{ dataTableName }} 表数据</h3>
            <button class="modal-close" @click="closeTableData">×</button>
          </div>
          <div class="modal-body" style="overflow:hidden;display:flex;flex-direction:column;gap:10px;">
            <div class="db-data-toolbar">
              <input
                v-model="dataKeyword"
                class="input"
                placeholder="关键字过滤（匹配所有字段）"
                @keyup.enter="loadTableData(1)"
              />
              <button class="btn" @click="loadTableData(1)" :disabled="dataLoading">
                {{ dataLoading ? '查询中…' : '查询' }}
              </button>
              <select class="select" v-model.number="dataSize" @change="loadTableData(1)" style="width:auto;">
                <option :value="10">10行/页</option>
                <option :value="20">20行/页</option>
                <option :value="50">50行/页</option>
              </select>
            </div>
            <div class="db-data-meta">
              <span>共 {{ dataTotal }} 条</span>
              <span>第 {{ dataPage }} / {{ Math.max(dataPages, 1) }} 页</span>
              <span v-if="dataSortColumn">排序：{{ dataSortColumn }} {{ dataSortOrder === 'DESC' ? '↓' : '↑' }}</span>
              <span v-if="dataMaskedColumns.length" class="db-mask-tip">凭据类字段已掩码：{{ dataMaskedColumns.join('、') }}</span>
            </div>
            <div class="db-data-scroll">
              <div v-if="dataLoading" class="loading-state">加载中…</div>
              <div v-else-if="dataRows.length === 0" class="empty-state">该表暂无数据</div>
              <table v-else class="db-data-table">
                <thead>
                  <tr>
                    <th class="db-row-index">#</th>
                    <th
                      v-for="c in dataColumns"
                      :key="c"
                      :class="{ sorted: dataSortColumn === c }"
                      @click="sortTableData(c)"
                    >{{ c }}<span v-if="dataSortColumn === c">{{ dataSortOrder === 'DESC' ? ' ↓' : ' ↑' }}</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, ri) in dataRows" :key="ri">
                    <td class="db-row-index">{{ (dataPage - 1) * dataSize + ri + 1 }}</td>
                    <td v-for="c in dataColumns" :key="c" :title="formatCell(r[c])">
                      <span v-if="r[c] === null || r[c] === ''" class="db-cell-null">{{ r[c] === null ? 'NULL' : '(空)' }}</span>
                      <span v-else>{{ clip(formatCell(r[c])) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="db-data-pager">
              <button class="btn" :disabled="dataPage <= 1 || dataLoading" @click="loadTableData(dataPage - 1)">上一页</button>
              <button class="btn" :disabled="dataPage >= dataPages || dataLoading" @click="loadTableData(dataPage + 1)">下一页</button>
              <button class="btn" @click="loadTableData(dataPage)" :disabled="dataLoading">刷新</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="closeTableData">关闭</button>
          </div>
        </div>
      </div>

      <!-- 回收站 -->
      <div v-if="activeTab === 'recycle'" class="recycle-view">
        <div class="view-header">
          <h3>回收站</h3>
          <button class="btn" @click="loadRecycle">刷新</button>
        </div>
        <div class="mobile-card-list">
          <div v-if="recycleList.length === 0" class="empty-state">回收站为空</div>
          <div v-for="b in recycleList" :key="b.id" class="mobile-card">
            <div class="mobile-card-header">
              <div class="mobile-card-title">{{ b.title || b.name || '商品 ' + b.id }}</div>
              <span class="mobile-card-badge" :class="b.approvalStatus ? 'pending' : ''">
                {{ b.approvalStatus ? '已申请' : '可操作' }}
              </span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span class="label">分销软件</span><span class="value">{{ b.software || '-' }}</span></div>
              <div class="mobile-card-row"><span class="label">删除时间</span><span class="value">{{ b.deleteTime || '-' }}</span></div>
            </div>
            <div class="mobile-card-footer">
              <template v-if="isAdmin">
                <button class="btn btn-success" @click="restoreBook(b)">恢复</button>
                <button class="btn btn-danger" @click="hardDeleteBook(b)">彻底删除</button>
              </template>
              <template v-else>
                <button class="btn" :disabled="b.approvalStatus" @click="submitApproval(b, 'RESTORE')">申请恢复</button>
                <button class="btn btn-danger" :disabled="b.approvalStatus" @click="submitApproval(b, 'DELETE')">申请删除</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据库管理 -->
      <div v-if="activeTab === 'database' && (isAdmin || userPermissions.includes('database'))" class="database-view">
        <div class="view-header">
          <h3>数据库管理</h3>
          <button class="btn" @click="loadTables">刷新</button>
        </div>
        <div class="action-bar">
          <button class="btn" @click="backupDatabase">备份数据库</button>
        </div>
        <!-- 桌面端：数据表用真表格，操作列保留查看结构/查看数据 -->
        <div class="pc-only pc-scroll">
          <table class="pc-table">
            <thead>
              <tr><th>表名</th><th class="wrap">注释</th><th class="num">行数</th><th class="num">数据大小</th><th class="num">索引大小</th><th>更新时间</th><th class="wrap">操作</th></tr>
            </thead>
            <tbody>
              <tr v-for="t in tables" :key="t.tableName">
                <td class="mono"><b>{{ t.tableName }}</b></td>
                <td class="wrap">{{ t.comment || '-' }}</td>
                <td class="num">{{ t.rowCount }}</td>
                <td class="num">{{ t.dataSizeMB }} MB</td>
                <td class="num">{{ t.indexSizeMB }} MB</td>
                <td class="mono muted">{{ fmtShort(t.updateTime) }}</td>
                <td class="ops">
                  <button class="btn btn-sm" @click="viewTableStructure(t.tableName)">查看结构</button>
                  <button class="btn btn-sm" @click="viewTableData(t.tableName)">查看数据</button>
                </td>
              </tr>
              <tr v-if="tables.length === 0"><td colspan="7" class="pc-table-empty">暂无数据表</td></tr>
            </tbody>
          </table>
        </div>
        <div class="mobile-card-list mob-only">
          <div v-if="tables.length === 0" class="empty-state">暂无数据表</div>
          <div v-for="t in tables" :key="t.tableName" class="mobile-card">
            <div class="mobile-card-header">
              <div class="mobile-card-title">{{ t.tableName }}</div>
              <span class="mobile-card-badge">{{ t.rowCount }} 条</span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span class="label">数据大小</span><span class="value">{{ t.dataSizeMB }} MB</span></div>
              <div class="mobile-card-row"><span class="label">索引大小</span><span class="value">{{ t.indexSizeMB }} MB</span></div>
              <div class="mobile-card-row"><span class="label">注释</span><span class="value">{{ t.comment || '-' }}</span></div>
            </div>
            <div class="mobile-card-footer">
              <button class="btn" @click="viewTableStructure(t.tableName)">查看结构</button>
              <button class="btn" @click="viewTableData(t.tableName)">查看数据</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据导出 -->
      <div v-if="activeTab === 'export'" class="export-view">
        <div class="view-header">
          <h3>数据导出</h3>
        </div>
        <div class="export-list">
          <div class="export-item" v-for="item in exportItems" :key="item.key">
            <div class="export-icon" :style="{background: item.bg}">{{ item.icon }}</div>
            <div class="export-info">
              <span class="export-name">{{ item.name }}</span>
              <span class="export-desc">{{ item.desc }}</span>
            </div>
            <div class="export-actions">
              <button class="btn btn-sm" @click="downloadData(item.key)">下载</button>
              <button class="btn btn-sm" :disabled="sendingEmail === item.key" @click="sendEmail(item.key)">
                {{ sendingEmail === item.key ? '发送中…' : '发邮箱' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 邮件配置 -->
      <div v-if="activeTab === 'email' && isAdmin" class="email-view">
        <div class="view-header">
          <h3>邮件配置</h3>
        </div>
        <div class="config-form">
          <div class="form-group">
            <label class="form-label">收件邮箱</label>
            <input v-model="emailConfig.toEmail" class="input" placeholder="接收通知的邮箱" />
          </div>
          <div class="form-group">
            <label class="form-label">SMTP服务器</label>
            <input v-model="emailConfig.smtpHost" class="input" placeholder="smtp.qq.com" />
          </div>
          <div class="form-group">
            <label class="form-label">SMTP端口</label>
            <input v-model="emailConfig.smtpPort" type="number" class="input" placeholder="465" />
          </div>
          <div class="form-group">
            <label class="form-label">发件邮箱</label>
            <input v-model="emailConfig.fromEmail" class="input" placeholder="发件邮箱" />
          </div>
          <div class="form-group">
            <label class="form-label">授权码</label>
            <input v-model="emailConfig.authCode" type="password" class="input"
                   :placeholder="emailConfig.authCodeSet ? '已配置，留空则不修改' : 'SMTP授权码'" autocomplete="new-password" />
            <p class="form-hint" v-if="emailConfig.authCodeSet">授权码已保存，不重新填写不会覆盖原值</p>
          </div>
          <div class="form-group">
            <label class="checkbox-group">
              <input type="checkbox" v-model="emailConfig.enableDailyReport" />
              <span>启用日报邮件通知（每天20:00发送操作日志和运行日志）</span>
            </label>
          </div>
          <p class="smtp-source">当前实际发信使用：{{ smtpSourceText }}</p>
          <button class="btn-primary btn-block" @click="saveEmailConfig">保存配置</button>
        </div>
      </div>

      <!-- 相册 -->
      <div v-if="activeTab === 'album'" class="album-view">
        <div class="view-header">
          <h3>相册</h3>
          <div class="header-actions">
            <button class="btn btn-sm" @click="triggerUpload('image')">上传图片</button>
            <button class="btn btn-sm" @click="triggerUpload('video')">上传视频</button>
          </div>
          <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="handleUpload('image', $event)" />
          <input ref="videoInput" type="file" accept="video/*" multiple style="display:none" @change="handleUpload('video', $event)" />
        </div>
        <div class="album-tabs">
          <button class="album-tab" :class="{active: albumTab === 'all'}" @click="albumTab = 'all'">全部</button>
          <button class="album-tab" :class="{active: albumTab === 'image'}" @click="albumTab = 'image'">图片</button>
          <button class="album-tab" :class="{active: albumTab === 'video'}" @click="albumTab = 'video'">视频</button>
        </div>
        <div class="album-grid">
          <div v-if="filteredAlbum.length === 0" class="empty-state" style="grid-column:1/-1">相册为空</div>
          <div v-for="item in filteredAlbum" :key="item.type + item.id" class="album-item" @click="previewAlbum(item)">
            <img v-if="item.type === 'image'" :src="item.thumb" loading="lazy" @error="onThumbError(item)" />
            <div v-else class="video-thumb">
              <img v-if="item.thumb" :src="item.thumb" loading="lazy" @error="onThumbError(item)" />
              <span v-else class="video-icon">🎬</span>
              <span class="play-icon">▶</span>
            </div>
            <button class="album-del" title="删除" @click.stop="deleteAlbumItem(item)">×</button>
            <span v-if="item.uploading" class="album-uploading">{{ '上传中 ' + (item.progress || 0) + '%' }}</span>
            <span v-else-if="item.failed" class="album-failed">{{ item.rejected ? '不符合要求·已停止' : '已中断·自动续传' }}</span>
            <span v-if="item.transcoding" class="album-transcoding">转码中</span>
            <span class="album-type">{{ item.type === 'image' ? '图片' : '视频' }}</span>
          </div>
        </div>
      </div>


      <!-- 待审批 -->
      <div v-if="activeTab === 'pending' && isAdmin" class="pending-view">
        <div class="view-header">
          <h3>待审批</h3>
          <div class="header-actions">
            <button class="btn btn-sm" @click="batchApprove">批量通过</button>
            <button class="btn btn-sm btn-danger" @click="batchReject">批量拒绝</button>
            <button class="btn btn-sm" @click="loadPending">刷新</button>
          </div>
        </div>
        <div class="mobile-card-list">
          <div v-if="pendingList.length === 0" class="empty-state">暂无待审批申请</div>
          <div v-for="a in pendingList" :key="a.id" class="mobile-card" :style="{borderColor: selectedApprovals.includes(a.id) ? '#6366f1' : ''}">
            <div class="mobile-card-header">
              <div style="display:flex;align-items:center;gap:8px;flex:1;">
                <input type="checkbox" :checked="selectedApprovals.includes(a.id)" @change="toggleApproval(a.id)" style="width:18px;height:18px;" />
                <div class="mobile-card-title" style="margin:0">{{ a.bookName || '商品 ' + a.bookId }}</div>
              </div>
              <span class="mobile-card-badge" :class="a.approvalType === 'RESTORE' ? 'success' : 'danger'">
                申请{{ a.approvalType === 'RESTORE' ? '恢复' : '删除' }}
              </span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span class="label">申请人</span><span class="value">{{ a.applicantName }}</span></div>
              <div class="mobile-card-row"><span class="label">申请时间</span><span class="value">{{ a.applyTime }}</span></div>
            </div>
            <div class="mobile-card-footer">
              <button class="btn btn-success" @click="approveOne(a.id)">通过</button>
              <button class="btn btn-danger" @click="rejectOne(a.id)">拒绝</button>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- 底部导航 -->
    <BottomNav :active="navActive" :is-admin="isAdmin" :permissions="userPermissions" @go="onNav" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Pagination from '../components/Pagination.vue'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import { auth, toast, confirm, formatTime } from '../utils'
import { compressImage, addPending, removePending, listPending, uploadInChunks } from '../utils/upload'
import {
  userApi, bookApi, approvalApi, logApi, dbApi,
  exportApi, configApi, albumApi, authApi
} from '../api'

const router = useRouter()
const route = useRoute()
const user = ref(auth.getUser())
const isAdmin = computed(() => user.value?.role === 1)

// 页签与 URL 同步：刷新后停留在当前页面
const validTabs = ['home', 'users', 'database', 'export', 'email', 'album']
// 管理员专属页签：普通用户即使手改 URL 上的 tab 参数也回不到该视图
const adminOnlyTabs = ['email']

const guardTab = (key) => {
  if (!validTabs.includes(key)) return 'home'
  if (adminOnlyTabs.includes(key) && !auth.isAdmin()) return 'home'
  return key
}

const initTab = guardTab(route.query.tab)
const activeTab = ref(initTab)

const setTab = (key) => {
  const tab = guardTab(key)
  activeTab.value = tab
  const query = { ...route.query }
  if (tab === 'home') delete query.tab
  else query.tab = tab
  router.replace({ query })
  refreshTab(tab)
}

// 底部导航当前高亮项
const navActive = computed(() => {
  if (activeTab.value === 'home') return 'home'
  if (activeTab.value === 'album') return 'album'
  return ''
})

// 底部导航跳转
const onNav = (key) => {
  if (key === 'home') setTab('home')
  else if (key === 'album') setTab('album')
  else if (key === 'add') triggerUpload('image')
  // 操作日志 / 运行日志 / 我的属于纯路由跳转，已由 BottomNav 统一处理
}

// 切换页签时刷新对应数据，保证内容最新
const refreshTab = (tab) => {
  if (tab === 'album') loadAlbum()
  else if (tab === 'users' && isAdmin.value) loadUsers()
  else if (tab === 'recycle') loadRecycle()
  else if (tab === 'database' && (isAdmin.value || userPermissions.value.includes('database'))) loadTables()
  else if (tab === 'email' && isAdmin.value) loadEmailConfig()
  else if (tab === 'pending' && isAdmin.value) loadPending()
}

const goRoute = (path) => router.push(path)

// 浏览器前进/后退时同步页签
watch(() => route.query.tab, (t) => {
  const tab = guardTab(t)
  if (tab !== activeTab.value) activeTab.value = tab
})

// 标签配置
const allTabs = [
  { key: 'home', name: '首页', icon: '🏠', admin: false },
  { key: 'users', name: '用户管理', icon: '👥', admin: true },
  { key: 'database', name: '数据库', icon: '🗄️', admin: true },
  { key: 'export', name: '数据导出', icon: '📤', admin: true },
  { key: 'email', name: '邮件配置', icon: '📧', admin: true, adminOnly: true },
  { key: 'album', name: '相册', icon: '🖼️', admin: false },
  { key: 'pending', name: '待审批', icon: '⏳', admin: true, badge: 0 }
]

const userPermissions = computed(() => {
  try {
    const u = auth.getUser()
    if (u?.permissions) return JSON.parse(u.permissions)
  } catch (e) {}
  return []
})

const visibleTabs = computed(() => allTabs.filter(t => {
  if (t.adminOnly) return isAdmin.value
  if (!t.admin) return true
  if (isAdmin.value) return true
  return userPermissions.value.includes(t.key)
}))

const quickFunctions = computed(() => {
  // 普通用户按已分配权限动态展示功能入口；回收站、日志类、用户列表、系统设置仍属管理员
  const common = [
    { key: 'album', name: '相册', icon: '🖼️', bg: 'linear-gradient(135deg,#10b981,#059669)' }
  ]
  if (!auth.isAdmin()) {
    const u = auth.getUser()
    try {
      const perms = u?.permissions ? JSON.parse(u.permissions) : []
      const permFuncs = {
        export: { key: 'export', name: '数据导出', icon: '📤', bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
        oplog: { key: 'oplog', name: '操作日志', route: '/logs', icon: '📋', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
        runlog: { key: 'runlog', name: '运行日志', route: '/run-log', icon: '⚙️', bg: 'linear-gradient(135deg,#64748b,#475569)' },
        database: { key: 'database', name: '数据库', icon: '🗄️', bg: 'linear-gradient(135deg,#0f766e,#115e59)' }
      }
      for (const p of perms) {
        if (permFuncs[p]) common.push(permFuncs[p])
      }
    } catch (e) {}
    return common
  }
  return [
    { key: 'users', name: '用户列表', icon: '👥', bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
    ...common,
    { key: 'database', name: '数据库', icon: '🗄️', bg: 'linear-gradient(135deg,#0f766e,#115e59)' },
    { key: 'oplog', name: '操作日志', route: '/logs', icon: '📋', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
    { key: 'runlog', name: '运行日志', route: '/run-log', icon: '⚙️', bg: 'linear-gradient(135deg,#64748b,#475569)' },
    { key: 'settings', name: '系统设置', route: '/settings', icon: '🛠️', bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' }
  ]
})

const openFunction = (func) => {
  if (func.route) router.push(func.route)
  else setTab(func.key)
}

// 首页
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const currentDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`
})
const recentLogs = ref([])

// 用户列表
const users = ref([])
const userSearch = ref('')

// 商品数据

// 回收站
const recycleList = ref([])

// 数据库
const tables = ref([])
// 表数据弹窗
const dataModalVisible = ref(false)
const dataTableName = ref('')
const dataColumns = ref([])
const dataRows = ref([])
const dataTotal = ref(0)
const dataPages = ref(1)
const dataPage = ref(1)
const dataSize = ref(20)
const dataKeyword = ref('')
const dataLoading = ref(false)
const dataSortColumn = ref('')
const dataSortOrder = ref('ASC')
const dataMaskedColumns = ref([])

// 邮件配置
const emailConfig = reactive({
  toEmail: '', smtpHost: 'smtp.qq.com', smtpPort: 465,
  fromEmail: '', authCode: '', authCodeSet: false, smtpSource: 'application.yml',
  enableDailyReport: false
})
// 明确告诉管理员当前发信走的是界面配置还是配置文件，避免"改了不生效"的困惑
const smtpSourceText = computed(() => emailConfig.smtpSource === '邮件配置页'
  ? '邮件配置页填写的 SMTP 参数（保存后立即生效）'
  : '配置文件 application.yml 的默认 SMTP（界面未填完整时回落）')

// 相册
const albumTab = ref('all')
const albumItems = ref([])
const previewImg = ref('')
const previewVideo = ref('')
const previewItem = ref(null)
const imageInput = ref(null)
const videoInput = ref(null)
const filteredAlbum = computed(() => {
  if (albumTab.value === 'all') return albumItems.value
  return albumItems.value.filter(i => i.type === albumTab.value)
})

// 后端返回的是相对路径，需拼接 nginx 静态资源前缀才能直接访问
const resolveUrl = (p, base) => {
  if (!p) return ''
  if (/^https?:\/\//.test(p) || p.startsWith('/')) return p
  return `${base}/${p}`
}


// 待审批
const pendingList = ref([])
const selectedApprovals = ref([])

// 导出项
const exportItems = [
  { key: 'users', name: '用户数据', desc: '导出所有用户信息', icon: '👥', bg: '#eef2ff' },
  { key: 'logs', name: '操作日志', desc: '导出所有操作日志', icon: '📋', bg: '#fffbeb' },
  { key: 'runLogs', name: '运行日志', desc: '导出系统运行日志', icon: '⚙️', bg: '#f0f9ff' }
]

// 方法
const loadRecentLogs = async () => {
  // /api/logs 属于 JwtInterceptor 的管理员专属前缀，普通用户调用必然 403。
  // 后端尚未提供「仅看本人操作日志」的能力，这里先让非管理员不发起该请求，
  // 避免每次进控制台都产生一条失败请求和一条控制台报错。
  if (!isAdmin.value) { recentLogs.value = []; return }
  try {
    const res = await logApi.list({ page: 1, size: 5 })
    if (res.code === 200) recentLogs.value = res.data?.records || res.data || []
  } catch (e) {}
}

const loadUsers = async () => {
  try {
    const res = await userApi.list({ keyword: userSearch.value })
    if (res.code === 200) users.value = res.data?.records || res.data || []
  } catch (e) { toast.error('加载用户失败') }
}

const generateInviteCode = async () => {
  try {
    const res = await authApi.generateInviteCode()
    // 后端返回字段是 inviteCode / expireMinutes（原代码读 res.data.code 恒为 undefined，
    // 导致管理员点「生成邀请码」只看到「邀请码：undefined」）
    if (res.code === 200 && res.data && res.data.inviteCode) {
      toast.success(`邀请码：${res.data.inviteCode}（${res.data.expireMinutes || 3} 分钟内有效）`)
    } else {
      toast.error(res.msg || '生成失败')
    }
  } catch (e) { toast.error('生成失败') }
}

const toggleUserStatus = async (u) => {
  try {
    await userApi.updateStatus(u.id, u.status === 1 ? 0 : 1)
    toast.success('状态已更新')
    loadUsers()
  } catch (e) { toast.error('操作失败') }
}

const toggleUserRole = async (u) => {
  try {
    await userApi.updateRole(u.id, u.role === 1 ? 0 : 1)
    toast.success('角色已更新')
    loadUsers()
  } catch (e) { toast.error('操作失败') }
}

const deleteUser = async (u) => {
  if (u.id === user.value?.id) {
    toast.error('不能删除自己的账户')
    return
  }
  const ok = await confirm('删除用户', `确定要删除用户 ${u.username} 吗？`)
  if (!ok) return
  try {
    await userApi.delete(u.id)
    toast.success('删除成功')
    loadUsers()
  } catch (e) { toast.error('删除失败') }
}


// ---------- 权限设置 ----------
// 邮件配置为管理员专属功能，不再出现在可分配权限里
const assignablePerms = [
  { key: 'export', name: '数据导出', icon: '📤' },
  { key: 'oplog', name: '操作日志', icon: '📋' },
  { key: 'runlog', name: '运行日志', icon: '📊' },
  { key: 'database', name: '数据库管理', icon: '🗄️' }
]

const permModalVisible = ref(false)
// 表结构弹窗状态
const structureModalVisible = ref(false)
const structureTableName = ref('')
const structureColumns = ref([])
const structureIndexes = ref([])
const permTargetUser = ref(null)
const selectedPerms = ref([])
const permSaving = ref(false)

const openPermModal = (u) => {
  permTargetUser.value = u
  try {
    selectedPerms.value = u.permissions ? JSON.parse(u.permissions) : []
  } catch (e) {
    selectedPerms.value = []
  }
  permModalVisible.value = true
}

const savePermissions = async () => {
  if (!permTargetUser.value) return
  permSaving.value = true
  try {
    await userApi.updatePermissions(permTargetUser.value.id, JSON.stringify(selectedPerms.value))
    toast.success('权限保存成功')
    permModalVisible.value = false
    loadUsers()
  } catch (e) {
    toast.error('保存失败')
  } finally {
    permSaving.value = false
  }
}

const loadRecycle = async () => {
  try {
    const res = await bookApi.recycle({ page: 1, size: 100 })
    if (res.code === 200 || res.code === 20041) recycleList.value = res.data?.records || res.data || []
  } catch (e) { toast.error('加载回收站失败') }
}

const restoreBook = async (b) => {
  try {
    await bookApi.restore(b.id)
    toast.success('恢复成功')
    loadRecycle()
  } catch (e) { toast.error('恢复失败') }
}

const hardDeleteBook = async (b) => {
  const ok = await confirm('彻底删除', '确定要彻底删除吗？此操作不可恢复！')
  if (!ok) return
  try {
    await bookApi.hardDelete(b.id)
    toast.success('已彻底删除')
    loadRecycle()
  } catch (e) { toast.error('删除失败') }
}

const submitApproval = async (b, type) => {
  try {
    await approvalApi.submit({ bookId: b.id, approvalType: type })
    toast.success('申请已提交，等待管理员审批')
    loadRecycle()
  } catch (e) { toast.error('提交失败') }
}

const loadTables = async () => {
  try {
    const res = await dbApi.tables()
    if (res.code === 200) tables.value = res.data || []
  } catch (e) { toast.error('加载数据表失败') }
}

const backupDatabase = async () => {
  try {
    const res = await dbApi.backup()
    const url = URL.createObjectURL(res)
    const a = document.createElement('a')
    a.href = url
    a.download = `database_backup_${Date.now()}.sql`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('备份成功')
  } catch (e) { toast.error('备份失败') }
}

const viewTableStructure = async (tableName) => {
  try {
    const res = await dbApi.tableStructure(tableName)
    if (res.code === 200 && res.data) {
      structureTableName.value = tableName
      structureColumns.value = res.data.columns || []
      structureIndexes.value = res.data.indexes || []
      structureModalVisible.value = true
    } else {
      toast.error('加载表结构失败')
    }
  } catch (e) { toast.error('加载失败') }
}

const viewTableData = async (tableName) => {
  dataTableName.value = tableName
  dataKeyword.value = ''
  dataSortColumn.value = ''
  dataSortOrder.value = 'ASC'
  dataModalVisible.value = true
  await loadTableData(1)
}

const closeTableData = () => {
  dataModalVisible.value = false
  dataRows.value = []
  dataColumns.value = []
}

const loadTableData = async (page) => {
  if (!dataTableName.value || dataLoading.value) return
  dataLoading.value = true
  try {
    const res = await dbApi.tableData(dataTableName.value, {
      page: page || 1,
      size: dataSize.value,
      keyword: dataKeyword.value || undefined,
      orderBy: dataSortColumn.value || undefined,
      order: dataSortOrder.value || 'ASC'
    })
    if (res.code === 200 && res.data) {
      dataColumns.value = res.data.columns || []
      dataRows.value = res.data.rows || []
      dataTotal.value = Number(res.data.total || 0)
      dataPages.value = Number(res.data.pages || 1)
      dataPage.value = Number(res.data.page || page || 1)
      dataSortColumn.value = res.data.sortColumn || ''
      dataSortOrder.value = res.data.sortOrder || 'ASC'
      dataMaskedColumns.value = res.data.maskedColumns || []
    } else {
      toast.error(res.msg || '加载表数据失败')
    }
  } catch (e) {
    toast.error('加载表数据失败')
  } finally {
    dataLoading.value = false
  }
}

const sortTableData = (col) => {
  if (dataSortColumn.value === col) {
    dataSortOrder.value = dataSortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    dataSortColumn.value = col
    dataSortOrder.value = 'ASC'
  }
  loadTableData(1)
}

const formatCell = (v) => {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const clip = (str) => (str && str.length > 60 ? str.slice(0, 60) + '…' : str)

// 桌面表格里统一成 YYYY-MM-DD HH:mm:ss，去掉 ISO 的 T
const fmtShort = (t) => {
  if (!t) return '-'
  const s = String(t).replace('T', ' ')
  return s.length >= 19 ? s.slice(0, 19) : s
}

const loadEmailConfig = async () => {
  try {
    const res = await configApi.getEmail()
    if (res.code === 200 && res.data) {
      const d = { ...res.data }
      // 授权码后端只回掩码标记，不回填明文，也不把掩码写回输入框
      emailConfig.authCodeSet = d.authCodeSet === 'true' || d.authCodeSet === true
      delete d.authCodeSet; delete d.authCodeMasked
      if (d.enableDailyReport !== undefined) {
        d.enableDailyReport = d.enableDailyReport === true || d.enableDailyReport === 'true'
      }
      Object.assign(emailConfig, d)
      if (emailConfig.enableDailyReport === undefined) emailConfig.enableDailyReport = false
    }
  } catch (e) {}
}

const saveEmailConfig = async () => {
  try {
    await configApi.updateEmail(emailConfig)
    toast.success('配置已保存')
  } catch (e) { toast.error('保存失败') }
}

// 把后端实体转成相册条目
const toImageItem = (i) => ({
  type: 'image',
  id: i.id,
  name: i.originalName,
  createTime: i.createTime,
  thumb: resolveUrl(i.thumbnailPath || i.filePath || i.fileName, '/uploads/images'),
  full: resolveUrl(i.filePath || i.fileName, '/uploads/images'),
  transcoding: false
})
const toVideoItem = (v) => ({
  type: 'video',
  id: v.id,
  name: v.originalName,
  createTime: v.createTime,
  thumb: resolveUrl(v.coverPath, '/uploads/videos'),
  playUrl: resolveUrl(v.filePath || v.fileName, '/uploads/videos'),
  transcoding: v.status === 0
})

const albumLoaded = ref(false)
const loadAlbum = async (force = false) => {
  if (albumLoaded.value && !force) return // 已加载过就不重复请求
  try {
    const [imgRes, vidRes] = await Promise.all([
      albumApi.images({ page: 1, size: 100 }),
      albumApi.videos({ page: 1, size: 100 })
    ])
    const items = []
    ;(imgRes.data?.records || imgRes.data || []).forEach(i => items.push(toImageItem(i)))
    ;(vidRes.data?.records || vidRes.data || []).forEach(v => items.push(toVideoItem(v)))
    items.sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
    const pendingTemps = albumItems.value.filter(i => i.uploading || i.failed)
    albumItems.value = [...pendingTemps, ...items]
    albumLoaded.value = true
  } catch (e) { toast.error('加载相册失败') }
}

const triggerUpload = async (type) => {
  setTab('album')
  await nextTick()
  if (type === 'image') imageInput.value?.click()
  else videoInput.value?.click()
}

// 底部导航“+”：快捷进入相册并选择图片上传
const quickUpload = () => { triggerUpload('image') }

// 上传成功后，用服务器真实地址替换本地临时预览
const replaceTempItems = (tempItems, realItems) => {
  const tempIds = new Set(tempItems.map(t => t.id))
  const rest = albumItems.value.filter(i => !tempIds.has(i.id))
  tempItems.forEach(t => { if (t.url) URL.revokeObjectURL(t.url) })
  const map = new Map(rest.map(it => [it.type + it.id, it]))
  realItems.forEach(it => map.set(it.type + it.id, it))
  albumItems.value = Array.from(map.values())
    .sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
}

// —— 上传并发池（最多3路并行，慢速链路下多文件互不等待）——
const pool = { active: 0, limit: 3, waiting: [] }
const pumpPool = () => {
  while (pool.active < pool.limit && pool.waiting.length) {
    const task = pool.waiting.shift()
    pool.active++
    Promise.resolve(task()).finally(() => { pool.active--; pumpPool() })
  }
}

// 单文件单次尝试：成功 ok / 失败 fail / 被取消 cancelled
const tryUpload = async (record, temp) => {
  if (temp.cancelled) return 'cancelled'
  const setProgress = (pct) => { if (!temp.cancelled) temp.progress = Math.max(temp.progress, pct) }
  const onAxiosProgress = (pe) => {
    if (!temp.cancelled) setProgress(pe.total ? Math.min(99, Math.round((pe.loaded / pe.total) * 100)) : 0)
  }
  try {
    let res
    if (record.blob.size >= 4 * 1024 * 1024) {
      // 4MB 以上才走分片并行通道：小文件分片的握手与调度开销反而更慢
      res = await uploadInChunks(record, setProgress)
    } else {
      const formData = new FormData()
      formData.append('file', record.blob, record.name)
      res = record.type === 'image'
        ? await albumApi.uploadImage(formData, onAxiosProgress)
        : await albumApi.uploadVideo(formData, onAxiosProgress)
    }
    if (temp.cancelled) return 'cancelled'
    const map = res?.data
    if (!map || map.success === false) {
      // 业务性拒绝（格式/大小限制）重试无意义，直接提示
      toast.error(map?.message || '上传失败')
      return 'rejected'
    }
    const real = map.data ? [record.type === 'image' ? toImageItem(map.data) : toVideoItem(map.data)] : []
    replaceTempItems([temp], real)
    await removePending(record.qid)
    if (record.type === 'video') setTimeout(() => loadAlbum(true), 6000)
    return 'ok'
  } catch (err) {
    return 'fail'
  }
}

// 失败自动重试（应对弱网抖动），共尝试3次；仍失败则保留队列，下次进入页面自动续传
const uploadOne = async (record, temp) => {
  let result = 'fail'
  for (let attempt = 0; attempt < 3; attempt++) {
    result = await tryUpload(record, temp)
    if (result !== 'fail') break
    if (result === 'rejected') break
    if (temp.cancelled) { result = 'cancelled'; break }
    await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
    temp.progress = 0
  }
  if (result === 'rejected') {
    // 业务性拒绝（格式/大小不符）重试无意义，必须移出本地队列，
    // 否则这条任务会变成永久"上传中"的僵尸记录，每次进页面都重复提示续传
    try { await removePending(record.qid) } catch (e) { /* 存储不可用时忽略 */ }
    temp.uploading = false
    temp.failed = true
    temp.rejected = true
  } else if (result === 'fail') {
    temp.uploading = false
    temp.failed = true
    toast.error(`"${temp.name}" 上传失败，已保留，稍后自动续传`)
  }
}

const makeTempItem = (record, idx) => {
  const url = URL.createObjectURL(record.blob)
  const base = {
    type: record.type,
    id: -(Date.now() + idx),
    qid: record.qid,
    name: record.name,
    createTime: record.createTime,
    uploading: true,
    progress: 0,
    failed: false,
    url,
    transcoding: false
  }
  return record.type === 'image'
    ? { ...base, thumb: url, full: url }
    : { ...base, thumb: '', playUrl: url }
}

const enqueueUploadTask = (record, temp) => {
  pool.waiting.push(() => uploadOne(record, temp))
  pumpPool()
}

// 选择文件 → 图片本地压缩（体积常能降5-10倍）→ 存入IndexedDB → 入队上传
const handleUpload = async (type, e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  e.target.value = ''
  toast.info(`已加入上传队列：${files.length} 个文件`)
  for (let idx = 0; idx < files.length; idx++) {
    let payload = files[idx]
    if (type === 'image') payload = await compressImage(payload)
    const record = {
      qid: 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + idx,
      type,
      name: payload.name,
      blob: payload,
      createTime: new Date().toISOString()
    }
    try { await addPending(record) } catch (err) { /* 存储失败不阻塞上传 */ }
    const temp = makeTempItem(record, idx)
    albumItems.value = [temp, ...albumItems.value]
    enqueueUploadTask(record, temp)
  }
}

// 读取 Blob 头部若干字节，确认数据仍真实可读
const readBlobProbe = (blob) => new Promise((resolve) => {
  try {
    const probe = blob.slice(0, Math.min(16, blob.size))
    if (typeof probe.arrayBuffer === 'function') {
      probe.arrayBuffer().then(buf => resolve(buf && buf.byteLength > 0), () => resolve(false))
      return
    }
    // 老浏览器兜底：FileReader
    const fr = new FileReader()
    fr.onload = () => resolve(!!fr.result && fr.result.byteLength > 0)
    fr.onerror = () => resolve(false)
    fr.readAsArrayBuffer(probe)
  } catch (e) { resolve(false) }
})

// 校验 IndexedDB 中持久化的 Blob 是否仍可用。
// iOS Safari 等浏览器在页面重开后可能已释放文件句柄，此时 blob.size 仍显示原值，
// 但 slice 出来是空数据，上传必然被服务端以 "Required part 'file' is not present" 拒绝（HTTP 400），
// 表现为卡片永久停在「上传中 0%」。
const isBlobUsable = async (blob) => {
  if (!blob || typeof blob.slice !== 'function') return false
  if (!(blob.size > 0)) return false
  return await readBlobProbe(blob)
}

// 进入页面时恢复上次未完成的上传（刷新/退出导致中断的文件自动续传）
const resumePendingUploads = async () => {
  let records = []
  try { records = await listPending() } catch (e) { return }
  records.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
  if (!records.length) return

  // 先剔除 Blob 已失效的僵尸任务：它们永远传不上去，留着会导致每次进页面都重复提示"自动续传"
  const usable = []
  let dropped = 0
  for (const rec of records) {
    if (await isBlobUsable(rec.blob)) {
      usable.push(rec)
    } else {
      try { await removePending(rec.qid) } catch (e) { /* 存储不可用时忽略 */ }
      dropped++
    }
  }
  if (dropped) {
    toast.error(`${dropped} 个未完成的上传已失效（浏览器已释放本地文件），已自动清除，请重新选择文件上传`)
  }
  if (!usable.length) return

  toast.info(`检测到 ${usable.length} 个未完成的上传，正在自动续传...`)
  usable.forEach((rec, idx) => {
    const temp = makeTempItem(rec, idx + 1000)
    albumItems.value = [temp, ...albumItems.value]
    enqueueUploadTask(rec, temp)
  })
}

// 上传进行中刷新/关闭页面会中断传输，弹出浏览器确认
const onBeforeUnload = (ev) => {
  if (albumItems.value.some(i => i.uploading)) {
    ev.preventDefault()
    ev.returnValue = ''
  }
}

const onThumbError = (item) => {
  // 缩略图加载失败时回退：图片退回原图地址，视频退回默认图标
  if (item.type === 'image' && item.full && item.thumb !== item.full) {
    item.thumb = item.full
  } else if (item.type === 'video' && item.thumb) {
    item.thumb = ''
  }
}

const previewAlbum = (item) => {
  previewItem.value = item
  if (item.type === 'image') {
    previewImg.value = item.full || item.thumb
  } else {
    previewVideo.value = item.playUrl || item.thumb
  }
}

const closePreview = () => {
  previewImg.value = ''
  previewVideo.value = ''
  previewItem.value = null
}

const deleteAlbumItem = async (item) => {
  // 本地临时卡片（id 为负数）：服务器上并无对应记录，调删除接口必然失败，
  // 必须直接取消上传并从浏览器 IndexedDB 队列中移除，否则每次进页面都会"自动续传"复活
  if (item.id < 0) {
    const ok = await confirm('移除', `「${item.name || '该文件'}」尚未上传成功，移除后将不再自动续传，确定移除吗？`)
    if (!ok) return
    item.cancelled = true
    item.uploading = false
    item.failed = false
    if (item.qid) { try { await removePending(item.qid) } catch (e) { /* 存储不可用时忽略 */ } }
    if (item.url) URL.revokeObjectURL(item.url)
    albumItems.value = albumItems.value.filter(i => !(i.type === item.type && i.id === item.id))
    toast.success('已移除，不会再自动续传')
    return
  }
  const ok = await confirm('删除', `确定要删除该${item.type === 'image' ? '图片' : '视频'}吗？`)
  if (!ok) return
  try {
    const res = item.type === 'image' ? await albumApi.deleteImage(item.id)
                                      : await albumApi.deleteVideo(item.id)
    if (res && res.code !== 200) throw new Error(res.message || '删除失败')
    albumItems.value = albumItems.value.filter(i => !(i.type === item.type && i.id === item.id))
    toast.success('删除成功')
    loadAlbum()
  } catch (e) { toast.error(e?.message || '删除失败') }
}

const deleteFromPreview = async () => {
  const item = previewItem.value
  if (!item) return
  await deleteAlbumItem(item)
  closePreview()
}
const loadPending = async () => {
  try {
    const res = await approvalApi.pending({ page: 1, size: 100 })
    if (res.code === 200) pendingList.value = res.data?.records || res.data || []
    selectedApprovals.value = []
  } catch (e) { toast.error('加载失败') }
}

const toggleApproval = (id) => {
  const idx = selectedApprovals.value.indexOf(id)
  if (idx > -1) selectedApprovals.value.splice(idx, 1)
  else selectedApprovals.value.push(id)
}

const approveOne = async (id) => {
  try {
    await approvalApi.approve(id, '')
    toast.success('已通过')
    loadPending()
  } catch (e) { toast.error('操作失败') }
}

const rejectOne = async (id) => {
  const remark = prompt('请输入拒绝原因（可选）：')
  try {
    await approvalApi.reject(id, remark || '')
    toast.success('已拒绝')
    loadPending()
  } catch (e) { toast.error('操作失败') }
}

const batchApprove = async () => {
  if (!selectedApprovals.value.length) { toast.warning('请先选择'); return }
  try {
    await approvalApi.batchApprove(selectedApprovals.value)
    toast.success('批量通过成功')
    loadPending()
  } catch (e) { toast.error('操作失败') }
}

const batchReject = async () => {
  if (!selectedApprovals.value.length) { toast.warning('请先选择'); return }
  try {
    await approvalApi.batchReject(selectedApprovals.value)
    toast.success('批量拒绝成功')
    loadPending()
  } catch (e) { toast.error('操作失败') }
}

const downloadData = async (type) => {
  try {
    let res
    if (type === 'users') res = await exportApi.downloadUsers()
    else if (type === 'books') res = await exportApi.downloadBooks()
    else if (type === 'logs') res = await exportApi.downloadLogs()
    else res = await exportApi.downloadRunLogs()
    const url = URL.createObjectURL(res)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('下载成功')
  } catch (e) { toast.error('下载失败') }
}

// 正在发送的导出类型，用于按钮 loading 与防重复点击
const sendingEmail = ref('')

const sendEmail = async (type) => {
  if (sendingEmail.value) {
    toast.warning('上一封邮件还在发送中，请稍候')
    return
  }
  // 收件邮箱：优先用「邮件配置」里已保存的地址，没有则让用户临时填一个
  let toEmail = (emailConfig.toEmail || '').trim()
  if (!toEmail) {
    toEmail = (prompt('请输入收件邮箱', '') || '').trim()
    if (!toEmail) {
      toast.warning('未填写收件邮箱，已取消发送')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      toast.error('邮箱格式不正确')
      return
    }
  }
  sendingEmail.value = type
  toast.info('正在发送，附件生成与邮件投递需要几秒…')
  try {
    const res = type === 'users' ? await exportApi.sendUsersEmail(toEmail)
              : type === 'books' ? await exportApi.sendBooksEmail(toEmail)
              : type === 'logs'  ? await exportApi.sendLogsEmail(toEmail)
              :                    await exportApi.sendRunLogsEmail(toEmail)
    // 后端用 ResponseEntity 返回 {code,msg}，业务失败时 HTTP 状态码非 2xx 会走 catch
    if (res && res.code && res.code !== 200) {
      toast.error(res.msg || '发送失败')
      return
    }
    toast.success(res?.msg || `已发送到 ${toEmail}`)
  } catch (e) {
    const msg = e?.response?.data?.msg || e?.message || '发送失败'
    toast.error(msg)
  } finally {
    sendingEmail.value = ''
  }
}

onMounted(() => {
  loadRecentLogs()
  // 只加载当前视图需要的数据，其余页签打开时再拉（每个请求都要过 Cloudflare 往返，越少越快）
  refreshTab(activeTab.value)
  window.addEventListener('beforeunload', onBeforeUnload)
  resumePendingUploads()
  // 从其他页面点底部导航“+”跳转过来时，直接打开文件选择
  if (route.query.upload === '1') {
    const q = { ...route.query }
    delete q.upload
    router.replace({ query: q })
    triggerUpload('image')
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
}
.content { padding: 14px 14px 20px; }
.view-header {
  flex-wrap: wrap;
  gap: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.view-header h3 { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0; }
.header-actions { display: flex; gap: 6px; }
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.filter-bar .input { flex: 1; min-width: 150px; }
.action-bar { display: flex; gap: 8px; margin-bottom: 12px; }

/* 首页 */
.welcome-card {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  padding: 20px;
  color: white;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.welcome-text h2 { font-size: 18px; margin-bottom: 4px; }
.welcome-text p { font-size: 13px; opacity: 0.9; }
.welcome-date { font-size: 12px; opacity: 0.8; }
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}
.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.function-item:active { transform: scale(0.96); }
.function-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.function-name { font-size: 12px; color: #475569; }
.recent-list {
  background: white;
  border-radius: 14px;
  padding: 8px 16px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.recent-item:last-child { border-bottom: none; }
.recent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.recent-dot.success { background: #10b981; }
.recent-dot.error { background: #ef4444; }
.recent-info { flex: 1; }
.recent-action { display: block; font-size: 13px; color: #1e293b; }
.recent-time { display: block; font-size: 11px; color: #94a3b8; }
.recent-module { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; }

/* 相册 */
.album-tabs {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.album-tab {
  padding: 6px 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
}
.album-tab.active {
  background: #6366f1;
  color: white;
}
.album-grid {
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.album-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f1f5f9;
}
.album-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.video-thumb {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}
.video-thumb img { width: 100%; height: 100%; object-fit: cover; }
.video-icon { font-size: 32px; }
.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}
.album-type {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
}
.album-del {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: white;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.album-del:active { background: #ef4444; }
.album-transcoding {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(245,158,11,0.9);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
}
.album-failed {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(239,68,68,0.85);
  color: white;
  font-size: 9px;
  padding: 2px 4px;
  text-align: center;
}
.album-uploading {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(99,102,241,0.85);
  color: white;
  font-size: 9px;
  padding: 2px 4px;
  text-align: center;
}
.img-preview-del {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 26px;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 22px;
  background: rgba(239,68,68,0.85);
  color: white;
  font-size: 14px;
  cursor: pointer;
}
.img-preview-del:active { background: #dc2626; }
.img-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.img-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}
.video-preview {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  background: #000;
}
.img-preview-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  color: white;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}
.img-preview-close:hover { background: rgba(255,255,255,0.35); }

/* 导出 */
.export-list { display: flex; flex-direction: column; gap: 10px; }
.export-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: white;
  border-radius: 12px;
}
.export-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.export-info { flex: 1; }
.export-name { display: block; font-size: 14px; font-weight: 500; color: #1e293b; }
.export-desc { display: block; font-size: 12px; color: #94a3b8; }
.export-actions { display: flex; gap: 6px; }

/* 配置表单 */
.config-form {
  background: white;
  border-radius: 14px;
  padding: 16px;
}
.config-form .form-group { margin-bottom: 14px; }
.config-form .form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
}
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}
.checkbox-group input { width: 16px; height: 16px; }
.btn-block {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  min-height: 44px;
}

/* 日志入口 */

/* 电脑端适配 */
@media (min-width: 769px) {
    .dashboard { padding-bottom: 0; }
  .function-grid { grid-template-columns: repeat(6, 1fr); }
  .album-grid {
  margin-bottom: 12px; grid-template-columns: repeat(6, 1fr); }
}

/* ---------- 表数据弹窗 ---------- */
.db-data-toolbar { display: flex; gap: 8px; align-items: center; }
.db-data-toolbar .input { flex: 1; min-width: 0; }
.db-data-meta { display: flex; gap: 14px; font-size: 12px; color: #64748b; }
.db-data-scroll { flex: 1; overflow: auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; }
.db-data-table { width: max-content; min-width: 100%; font-size: 12px; border-collapse: collapse; }
.db-data-table th, .db-data-table td { padding: 6px 10px; border: 1px solid #e2e8f0; white-space: nowrap; text-align: left; }
.db-data-table th { background: #f1f5f9; position: sticky; top: 0; cursor: pointer; user-select: none; }
.db-data-table th.sorted { color: #4f46e5; }
.db-data-table td { max-width: 320px; overflow: hidden; text-overflow: ellipsis; }
.db-row-index { color: #94a3b8; }
.db-cell-null { color: #cbd5e1; font-style: italic; }
.db-mask-tip { color: #b45309; }
.db-data-pager { display: flex; gap: 8px; justify-content: flex-end; }
.loading-state { padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; }

.smtp-source { font-size: 12px; color: #64748b; margin: 4px 0 10px; }

/* ---------- 权限设置弹窗 ---------- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  animation: modalIn 0.2s ease;
}
@keyframes modalIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 { margin: 0; font-size: 16px; }
.modal-close {
  background: none; border: none; font-size: 24px; cursor: pointer; color: #999;
}
.modal-body { padding: 20px; max-height: 60vh; overflow-y: auto; }
.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.perm-list { display: flex; flex-direction: column; gap: 8px; }
.perm-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
}
.perm-item input[type="checkbox"] { width: 18px; height: 18px; }
.perm-icon { font-size: 20px; }
.perm-text { font-size: 14px; color: #333; }
</style>






<style>
/* 桌面端布局（放在非 scoped 块，避免与各页 scoped 规则争优先级） */
@media (min-width: 769px) {
  .u-role { font-size: 11px; line-height: 18px; padding: 1px 8px; border-radius: 999px; white-space: nowrap; }
  .u-admin { background: #ede9fe; color: #6d28d9; }
  .u-user { background: #e0f2fe; color: #0369a1; }
}

/* ---------- 桌面端（≥769px）栅格与密度 ---------- */
@media (min-width: 769px) {
  .content { padding: 18px 24px 40px; }
  .function-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 14px; }
  .mobile-card-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; align-items: start; }
  .album-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .recent-list { max-width: 980px; }
  .welcome-card { padding: 20px 22px; }
  .export-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 12px; }
  .config-form { max-width: 620px; }
  .smtp-source { font-size: 12px; color: #64748b; margin: 4px 0 10px; }
  .view-header h3 { font-size: 17px; }
}
</style>