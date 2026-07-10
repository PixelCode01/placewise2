const Register = {
    template: `
    <div class="container py-4">
        <div class="row g-0 shadow-sm rounded overflow-hidden border" style="max-width: 960px; margin: 1.5rem auto; background-color: var(--bg-surface); border-color: var(--border-color) !important;">
            <div class="col-md-5 d-none d-md-block p-0">
                <img src="assets/images/register_bg.png" class="w-100 h-100" style="object-fit: cover; min-height: 540px;" alt="Placement Portal Register">
            </div>
            <div class="col-md-7">
                <div class="p-4 p-md-5">
                    <h1 class="h3 mb-1">Create an Account</h1>
                    <p class="text-muted small mb-4">Register as a student candidate or company recruiter</p>

                    <div v-if="success" class="alert alert-success py-2 small mb-3">{{ success }}</div>
                    <div v-if="error" class="alert alert-danger py-2 small mb-3">{{ error }}</div>

                    <div class="mb-3">
                        <label class="form-label" for="reg-role">Role</label>
                        <select class="form-select" v-model="role" id="reg-role">
                            <option value="student">Student (Candidate)</option>
                            <option value="company">Company Recruiter</option>
                        </select>
                    </div>

                    <form @submit.prevent="register">
                        <div class="mb-3">
                            <label class="form-label" for="reg-email">Email Address *</label>
                            <input type="email" class="form-control" v-model="email" placeholder="name@example.com" required id="reg-email">
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="reg-password">Password *</label>
                            <input type="password" class="form-control" v-model="password" placeholder="Minimum 6 characters" required minlength="6" id="reg-password">
                        </div>

                        <!-- Student Fields -->
                        <template v-if="role === 'student'">
                            <div class="mb-3">
                                <label class="form-label" for="reg-name">Full Name *</label>
                                <input type="text" class="form-control" v-model="full_name" placeholder="Full name" required id="reg-name">
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-5">
                                    <label class="form-label" for="reg-branch">Branch *</label>
                                    <select class="form-select" v-model="branch" required id="reg-branch">
                                        <option value="" disabled>Select Branch</option>
                                        <option value="Computer Science">Computer Science (CSE)</option>
                                        <option value="Information Technology">Information Technology (IT)</option>
                                        <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                                        <option value="Electrical Engineering">Electrical Engineering (EE)</option>
                                        <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                                        <option value="Civil Engineering">Civil Engineering (CE)</option>
                                        <option value="Chemical Engineering">Chemical Engineering (CHE)</option>
                                        <option value="Data Science & AI">Data Science & AI</option>
                                    </select>
                                </div>
                                <div class="col-4">
                                    <label class="form-label" for="reg-cgpa">CGPA</label>
                                    <input type="number" class="form-control" v-model="cgpa" step="0.01" min="0" max="10" placeholder="8.5" id="reg-cgpa">
                                </div>
                                <div class="col-3">
                                    <label class="form-label" for="reg-year">Year</label>
                                    <input type="number" class="form-control" v-model="year" min="1" max="5" placeholder="4" id="reg-year">
                                </div>
                            </div>
                        </template>

                        <!-- Company Fields -->
                        <template v-if="role === 'company'">
                            <div class="mb-3">
                                <label class="form-label" for="reg-company-name">Company Name *</label>
                                <input type="text" class="form-control" v-model="name" placeholder="Company name" required id="reg-company-name">
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <label class="form-label" for="reg-industry">Industry</label>
                                    <input type="text" class="form-control" v-model="industry" placeholder="e.g. Software" id="reg-industry">
                                </div>
                                <div class="col-6">
                                    <label class="form-label" for="reg-location">Location</label>
                                    <input type="text" class="form-control" v-model="location" placeholder="City" id="reg-location">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="reg-website">Website</label>
                                <input type="url" class="form-control" v-model="website" placeholder="https://example.com" id="reg-website">
                            </div>
                        </template>

                        <button type="submit" class="btn btn-primary w-100 mt-2 mb-3" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            {{ loading ? 'Registering...' : 'Create Account' }}
                        </button>
                    </form>

                    <p class="text-muted small mb-0 text-center">
                        Already have an account? <router-link to="/login" class="text-decoration-none fw-medium" style="color: var(--accent-forest);">Login here</router-link>.
                    </p>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            role: 'student',
            email: '', password: '',
            full_name: '', branch: '', cgpa: '', year: '',
            name: '', industry: '', location: '', website: '',
            loading: false,
            error: '', success: ''
        }
    },
    mounted() {
        document.title = 'Register | Placewise'
    },
    methods: {
        async register() {
            this.loading = true
            this.error = ''
            this.success = ''

            const endpoint = this.role === 'student'
                ? '/api/auth/register/student'
                : '/api/auth/register/company'

            const body = this.role === 'student'
                ? { email: this.email, password: this.password, full_name: this.full_name,
                    branch: this.branch, cgpa: this.cgpa ? parseFloat(this.cgpa) : null, year: this.year ? parseInt(this.year) : null }
                : { email: this.email, password: this.password, name: this.name,
                    industry: this.industry, location: this.location, website: this.website }

            const data = await api(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            })

            this.loading = false

            if (!data) { this.error = 'Something went wrong. Please try again.'; return }
            if (data.error) { this.error = data.error; return }

            this.success = data.message || 'Registration successful! Redirecting to login...'
            setTimeout(() => this.$router.push('/login'), 1500)
        }
    }
}
