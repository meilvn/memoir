<template>
  <div class="admin-page">
    <h1 class="page-title">👥 家庭成员管理</h1>

    <div class="admin-card card">
      <div class="table-header">
        <h2>用户列表</h2>
        <button class="btn btn-primary" @click="showAddForm = !showAddForm">
          + 新增用户
        </button>
      </div>

      <div v-if="showAddForm" class="add-user-form">
        <div class="form-row">
          <input v-model="newUser.username" placeholder="用户名" />
          <input v-model="newUser.email" placeholder="邮箱" type="email" />
          <input v-model="newUser.password" placeholder="密码" type="password" />
          <select v-model="newUser.role">
            <option value="MEMBER">成员</option>
            <option value="ADMIN">管理员</option>
          </select>
          <button class="btn btn-primary" @click="handleCreate" :disabled="creating">
            {{ creating ? '创建中...' : '创建' }}
          </button>
          <button class="btn btn-ghost" @click="showAddForm = false">取消</button>
        </div>
      </div>

      <table class="users-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>
              <select :value="user.role" @change="handleRoleChange(user.id, $event.target.value)">
                <option value="MEMBER">成员</option>
                <option value="ADMIN">管理员</option>
              </select>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <button class="btn btn-ghost danger" @click="handleDelete(user.id, user.username)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usersApi } from '@/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

const users = ref([])
const showAddForm = ref(false)
const creating = ref(false)
const newUser = ref({ username: '', email: '', password: '', role: 'MEMBER' })

onMounted(async () => {
  users.value = await usersApi.getAll()
})

async function handleCreate() {
  if (!newUser.value.username || !newUser.value.email || !newUser.value.password) {
    toast.error('请填写完整信息')
    return
  }
  try {
    creating.value = true
    await usersApi.create(newUser.value)
    toast.success('用户创建成功')
    newUser.value = { username: '', email: '', password: '', role: 'MEMBER' }
    showAddForm.value = false
    users.value = await usersApi.getAll()
  } catch {
    toast.error('创建失败')
  } finally {
    creating.value = false
  }
}

async function handleRoleChange(id, role) {
  await usersApi.updateRole(id, role)
  toast.success('角色已更新')
}

async function handleDelete(id, username) {
  if (!confirm(`确定删除用户 "${username}" 吗？`)) return
  await usersApi.remove(id)
  toast.success('用户已删除')
  users.value = users.value.filter(u => u.id !== id)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped lang="scss">
.admin-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-family: $font-serif;
  font-size: 2rem;
  margin-bottom: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.add-user-form {
  background: $bg-light;
  border-radius: $radius-sm;
  padding: 16px;
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  input, select {
    flex: 1;
    min-width: 150px;
    padding: 8px 12px;
    border: 1.5px solid $border;
    border-radius: $radius-sm;
    background: $bg-card;
  }
}

.users-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid $border;
  }

  th {
    color: $text-secondary;
    font-weight: 600;
    font-size: 0.85rem;
  }

  td select {
    padding: 4px 8px;
    border: 1px solid $border;
    border-radius: $radius-sm;
  }
}

.danger {
  color: $error !important;
}
</style>
