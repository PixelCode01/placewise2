const Login = {
    template: `
    <div class="container py-4">
        <div class="row g-0 shadow-sm rounded overflow-hidden border" style="max-width: 900px; margin: 2rem auto; background-color: var(--bg-surface); border-color: var(--border-color) !important;">
            <div class="col-md-6 d-none d-md-block p-0">
                <img src="assets/images/login_bg.png" class="w-100 h-100" style="object-fit: cover; min-height: 480px;" alt="Placement Portal">
            </div>
            <div class="col-md-6">
                <div class="p-4 p-md-5">
                    <h1 class="h3 mb-1">Welcome Back</h1>
                    <p class="text-muted small mb-4">Sign in to your placement portal account</p>

                    <div v-if="error" class="alert alert-danger py-2 small mb-3">{{ error }}</div>

                    <form @submit.prevent="login">
                        <div class="mb-3">
                            <label class="form-label" for="login-email">Email Address</label>
                            <input
                                type="email"
                                class="form-control"
                                v-model="email"
                                placeholder="name@example.com"
                                required
                                autocomplete="email"
                                id="login-email"
                            >
                        </div>
                        <div class="mb-4">
                            <label class="form-label" for="login-password">Password</label>
                            <div class="input-group">
                                <input
                                    :type="showPassword ? 'text' : 'password'"
                                    class="form-control"
                                    v-model="password"
                                    placeholder="Enter your password"
                                    required
                                    id="login-password"
                                >
                                <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword" style="border-left: none;">
                                    {{ showPassword ? 'Hide' : 'Show' }}
                                </button>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            {{ loading ? 'Signing In...' : 'Login' }}
                        </button>
                    </form>

                    <p class="text-muted small mb-0 text-center">
                        New here? <router-link to="/register" class="text-decoration-none fw-medium" style="color: var(--accent-forest);">Create an account</router-link>.
                    </p>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            email: '',
            password: '',
            loading: false,
            error: '',
            showPassword: false
        }
    },
    methods: {
        async login() {
            document.title = 'Login | Placewise'
            this.loading = true
            this.error = ''

            const data = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: this.email, password: this.password })
            })

            this.loading = false

            if (!data) {
                this.error = 'Unable to connect to server. Please try again.'
                return
            }

            if (data.error) {
                this.error = data.error
                return
            }

            localStorage.setItem('token', data.access_token)
            localStorage.setItem('refresh_token', data.refresh_token)
            localStorage.setItem('role', data.role)
            localStorage.setItem('user_id', data.user_id)

            const rootApp = this.$root
            rootApp.isLoggedIn = true
            rootApp.userRole = data.role

            this.$router.push('/' + data.role + '/dashboard')
        }
    }
}
