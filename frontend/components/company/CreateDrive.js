const CreateDrive = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Create Placement Drive</h1>
                <p class="text-muted mb-0">Publish a new job or internship opening for student applications.</p>
            </div>
            <router-link to="/company/dashboard" class="btn btn-outline-secondary btn-sm">&larr; Back to Dashboard</router-link>
        </div>

        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card p-4 p-md-5">
                    <div v-if="error" class="alert alert-danger py-2 small mb-3">{{ error }}</div>
                    <div v-if="success" class="alert alert-success py-2 small mb-3">{{ success }}</div>

                    <form @submit.prevent="submitDrive">
                        <div class="mb-3">
                            <label class="form-label" for="drive-job-title">Job Title *</label>
                            <input type="text" class="form-control" v-model="form.job_title" placeholder="e.g. Graduate Software Engineer" required id="drive-job-title">
                        </div>

                        <div class="mb-3">
                            <label class="form-label" for="drive-desc">Job Description & Requirements</label>
                            <textarea class="form-control" v-model="form.job_description" rows="4" placeholder="Detail the responsibilities, tech stack, and key skills..." id="drive-desc"></textarea>
                        </div>

                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <label class="form-label mb-0" for="drive-branch">Eligible Branches</label>
                                <span class="small text-muted">Click branches below to select</span>
                            </div>
                            <div class="d-flex flex-wrap gap-1 mb-2">
                                <button type="button" class="btn btn-sm" :class="isAllSelected ? 'btn-primary' : 'btn-outline-secondary'" @click="setPreset('all')">All Branches</button>
                                <button type="button" class="btn btn-sm" :class="isCircuitSelected ? 'btn-primary' : 'btn-outline-secondary'" @click="setPreset('circuit')">Circuit (CSE, IT, ECE, EE)</button>
                                <button type="button" class="btn btn-sm" :class="isCoreSelected ? 'btn-primary' : 'btn-outline-secondary'" @click="setPreset('core')">Core (ME, CE, CHE)</button>
                                <button type="button" class="btn btn-sm btn-outline-danger" v-if="form.eligibility_branch" @click="form.eligibility_branch = ''">Clear</button>
                            </div>
                            <div class="d-flex flex-wrap gap-1 mb-2">
                                <span
                                    v-for="b in availableBranches"
                                    :key="b"
                                    class="badge py-2 px-2"
                                    :class="isBranchSelected(b) ? 'bg-primary text-white' : 'bg-light text-dark border'"
                                    style="cursor: pointer; user-select: none;"
                                    @click="toggleBranch(b)"
                                >
                                    {{ isBranchSelected(b) ? '✓ ' : '+ ' }}{{ b }}
                                </span>
                            </div>
                            <input type="text" class="form-control form-control-sm" v-model="form.eligibility_branch" placeholder="Selected branches (e.g. Computer Science, Information Technology)" id="drive-branch">
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label" for="drive-cgpa">Min CGPA</label>
                                <input type="number" step="0.01" min="0" max="10" class="form-control" v-model="form.eligibility_cgpa" placeholder="7.0" id="drive-cgpa">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="drive-year">Passing Year</label>
                                <input type="number" min="1" max="5" class="form-control" v-model="form.eligibility_year" placeholder="4" id="drive-year">
                            </div>
                        </div>

                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label" for="drive-salary">CTC / Stipend</label>
                                <input type="text" class="form-control" v-model="form.salary" placeholder="e.g. 12 LPA or 40,000/mo" id="drive-salary">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="drive-deadline">Application Deadline *</label>
                                <input type="date" class="form-control" v-model="form.application_deadline" required id="drive-deadline">
                            </div>
                        </div>

                        <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                            <router-link to="/company/dashboard" class="btn btn-outline-secondary">Cancel</router-link>
                            <button type="submit" class="btn btn-primary" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                                {{ loading ? 'Submitting...' : 'Post Placement Drive' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            form: {
                job_title: '',
                job_description: '',
                eligibility_branch: '',
                eligibility_cgpa: '',
                eligibility_year: '',
                salary: '',
                application_deadline: ''
            },
            availableBranches: [
                'Computer Science',
                'Information Technology',
                'Electronics & Communication',
                'Electrical Engineering',
                'Mechanical Engineering',
                'Civil Engineering',
                'Chemical Engineering',
                'Data Science & AI'
            ],
            loading: false,
            error: '',
            success: ''
        }
    },
    computed: {
        selectedBranches() {
            if (!this.form.eligibility_branch) return []
            return this.form.eligibility_branch.split(',').map(b => b.trim()).filter(Boolean)
        },
        isAllSelected() {
            return this.form.eligibility_branch.toLowerCase().includes('all') ||
                (this.availableBranches.length > 0 && this.availableBranches.every(b => this.isBranchSelected(b)))
        },
        isCircuitSelected() {
            const circuit = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering']
            return circuit.every(b => this.isBranchSelected(b)) && this.selectedBranches.length === circuit.length
        },
        isCoreSelected() {
            const core = ['Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering']
            return core.every(b => this.isBranchSelected(b)) && this.selectedBranches.length === core.length
        }
    },
    mounted() {
        document.title = 'Create Placement Drive | Placewise'
    },
    methods: {
        isBranchSelected(branch) {
            if (!this.form.eligibility_branch) return false
            if (this.form.eligibility_branch.toLowerCase().includes('all')) return true
            const lower = branch.toLowerCase()
            return this.selectedBranches.some(b => b.toLowerCase() === lower)
        },
        toggleBranch(branch) {
            if (this.form.eligibility_branch.toLowerCase().includes('all')) {
                this.form.eligibility_branch = branch
                return
            }
            const current = [...this.selectedBranches]
            const idx = current.findIndex(b => b.toLowerCase() === branch.toLowerCase())
            if (idx >= 0) {
                current.splice(idx, 1)
            } else {
                current.push(branch)
            }
            this.form.eligibility_branch = current.join(', ')
        },
        setPreset(preset) {
            if (preset === 'all') {
                this.form.eligibility_branch = 'All Branches'
            } else if (preset === 'circuit') {
                this.form.eligibility_branch = 'Computer Science, Information Technology, Electronics & Communication, Electrical Engineering'
            } else if (preset === 'core') {
                this.form.eligibility_branch = 'Mechanical Engineering, Civil Engineering, Chemical Engineering'
            }
        },
        async submitDrive() {
            this.loading = true
            this.error = ''
            this.success = ''

            const body = {
                ...this.form,
                eligibility_cgpa: this.form.eligibility_cgpa ? parseFloat(this.form.eligibility_cgpa) : null,
                eligibility_year: this.form.eligibility_year ? parseInt(this.form.eligibility_year) : null
            }

            const data = await api('/api/company/drives', {
                method: 'POST',
                body: JSON.stringify(body)
            })

            this.loading = false

            if (!data) { this.error = 'Failed to submit drive.'; return }
            if (data.error) { this.error = data.error; return }

            this.success = 'Drive submitted! It will go live once approved by admin.'
            setTimeout(() => this.$router.push('/company/dashboard'), 1200)
        }
    }
}
