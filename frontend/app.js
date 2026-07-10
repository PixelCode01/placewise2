async function api(url, options = {}) {
    const token = localStorage.getItem('token')
    options.headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(options.headers || {})
    }
    try {
        const res = await fetch(url, options)
        if (res.status === 401) {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
                const refreshRes = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + refreshToken }
                })
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json()
                    localStorage.setItem('token', refreshData.access_token)
                    options.headers['Authorization'] = 'Bearer ' + refreshData.access_token
                    const retryRes = await fetch(url, options)
                    return await retryRes.json()
                }
            }
            localStorage.clear()
            router.push('/')
            return null
        }
        return await res.json()
    } catch (err) {
        console.error('API error:', err)
        return null
    }
}

const routes = [
    { path: '/', component: Landing },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/admin/dashboard', component: AdminDashboard, meta: { role: 'admin' } },
    { path: '/admin/companies', component: ManageCompanies, meta: { role: 'admin' } },
    { path: '/admin/students', component: ManageStudents, meta: { role: 'admin' } },
    { path: '/admin/drives', component: ManageDrives, meta: { role: 'admin' } },
    { path: '/admin/placements', component: ManagePlacements, meta: { role: 'admin' } },
    { path: '/company/dashboard', component: CompanyDashboard, meta: { role: 'company' } },
    { path: '/company/profile', component: EditCompanyProfile, meta: { role: 'company' } },
    { path: '/company/drives/create', component: CreateDrive, meta: { role: 'company' } },
    { path: '/company/drives/:id/applications', component: ViewApplications, meta: { role: 'company' } },
    { path: '/student/dashboard', component: StudentDashboard, meta: { role: 'student' } },
    { path: '/student/drives', component: BrowseDrives, meta: { role: 'student' } },
    { path: '/student/applications', component: MyApplications, meta: { role: 'student' } },
    { path: '/student/profile', component: EditProfile, meta: { role: 'student' } },
]

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')

    const publicPaths = ['/', '/login', '/register']
    if (!token && !publicPaths.includes(to.path)) {
        next('/login')
        return
    }

    if (token && publicPaths.includes(to.path)) {
        next('/' + role + '/dashboard')
        return
    }

    if (to.meta.role && to.meta.role !== role) {
        next('/' + role + '/dashboard')
        return
    }

    next()
})

const app = Vue.createApp({
    data() {
        return {
            isLoggedIn: !!localStorage.getItem('token'),
            userRole: localStorage.getItem('role') || ''
        }
    },
    methods: {
        logout() {
            localStorage.clear()
            this.isLoggedIn = false
            this.userRole = ''
            router.push('/')
        },
        syncAuth() {
            this.isLoggedIn = !!localStorage.getItem('token')
            this.userRole = localStorage.getItem('role') || ''
        }
    }
})

router.afterEach(() => {
    if (app && app._instance) {
        app._instance.data.isLoggedIn = !!localStorage.getItem('token')
        app._instance.data.userRole = localStorage.getItem('role') || ''
    }
})

app.use(router)
app.mount('#app')
