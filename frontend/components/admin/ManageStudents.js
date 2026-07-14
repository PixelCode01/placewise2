const ManageStudents = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Student Profiles</h1>
                <p class="text-muted mb-0">Verify resumes, academic performance, and placement status.</p>
            </div>
            <router-link to="/admin/dashboard" class="btn btn-outline-secondary btn-sm">&larr; Back to Dashboard</router-link>
        </div>

        <div v-if="alertMsg" class="alert alert-success alert-dismissible fade show" role="alert">
            {{ alertMsg }}
            <button type="button" class="btn-close" @click="alertMsg = ''"></button>
        </div>
        <div v-if="errorMsg" class="alert alert-danger alert-dismissible fade show" role="alert">
            {{ errorMsg }}
            <button type="button" class="btn-close" @click="errorMsg = ''"></button>
        </div>

        <div class="card mb-3 p-3">
            <div class="row g-2">
                <div class="col-md-8">
                    <input
                        id="student-search-input"
                        type="search"
                        class="form-control"
                        placeholder="Search by name, email, phone, or ID..."
                        v-model="searchQuery"
                        @input="onSearch"
                    />
                </div>
                <div class="col-md-4">
                    <select id="student-status-filter" class="form-select" v-model="statusFilter" @change="loadStudents">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="blacklisted">Blacklisted</option>
                    </select>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading students...</div>

        <div v-else-if="filtered.length === 0" class="empty-state">
            <h2 class="h4">No students found</h2>
            <p class="text-muted mb-0">Try adjusting your search or filter.</p>
        </div>

        <div v-else class="card">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Branch &amp; Year</th>
                            <th>CGPA</th>
                            <th>Resume</th>
                            <th>Status</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="s in filtered" :key="s.id" style="cursor:pointer;" @click="openDetail(s)">
                            <td>
                                <div class="fw-medium text-dark">{{ s.full_name }}</div>
                                <div class="text-muted small">{{ s.email }}</div>
                            </td>
                            <td class="text-muted">{{ s.branch || '-' }} (Yr {{ s.year || '-' }})</td>
                            <td class="fw-medium text-dark">{{ s.cgpa || '-' }}</td>
                            <td>
                                <a v-if="s.resume_path" :href="s.resume_path" target="_blank" class="small fw-medium" style="color: var(--accent-forest);" @click.stop>View</a>
                                <span v-else class="text-muted small">-</span>
                            </td>
                            <td>
                                <span class="status-badge" :class="s.is_active ? 'status-approved' : 'status-rejected'">
                                    {{ s.is_active ? 'Active' : 'Blacklisted' }}
                                </span>
                            </td>
                            <td class="text-end" @click.stop>
                                <button
                                    class="btn btn-sm"
                                    :class="s.is_active ? 'btn-outline-secondary' : 'btn-outline-primary'"
                                    @click="toggleActive(s.id, s.is_active)"
                                >
                                    {{ s.is_active ? 'Blacklist' : 'Activate' }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Student detail modal -->
        <div v-if="selected" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.4); z-index: 2000;" @click.self="selected = null">
            <div class="card p-4" style="width: 480px; max-width: 95vw; max-height: 85vh; overflow-y: auto;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h2 class="h5 mb-0">{{ selected.full_name }}</h2>
                    <button class="btn-close" @click="selected = null"></button>
                </div>
                <dl class="row small mb-3">
                    <dt class="col-5 text-muted">Email</dt><dd class="col-7">{{ selected.email }}</dd>
                    <dt class="col-5 text-muted">Branch</dt><dd class="col-7">{{ selected.branch || '-' }}</dd>
                    <dt class="col-5 text-muted">Year</dt><dd class="col-7">{{ selected.year || '-' }}</dd>
                    <dt class="col-5 text-muted">CGPA</dt><dd class="col-7">{{ selected.cgpa || '-' }}</dd>
                    <dt class="col-5 text-muted">Phone</dt><dd class="col-7">{{ selected.phone || '-' }}</dd>
                    <dt class="col-5 text-muted">Skills</dt><dd class="col-7">{{ selected.skills || '-' }}</dd>
                    <dt class="col-5 text-muted">LinkedIn</dt>
                    <dd class="col-7">
                        <a v-if="selected.linkedin" :href="selected.linkedin" target="_blank">Profile</a>
                        <span v-else>-</span>
                    </dd>
                    <dt class="col-5 text-muted">Resume</dt>
                    <dd class="col-7">
                        <a v-if="selected.resume_path" :href="selected.resume_path" target="_blank" style="color: var(--accent-forest);">View Resume</a>
                        <span v-else class="text-muted">Not uploaded</span>
                    </dd>
                </dl>
                <div v-if="detailApplications.length > 0">
                    <div class="fw-medium small mb-2">Application History</div>
                    <div v-for="a in detailApplications" :key="a.id" class="d-flex justify-content-between small py-1 border-bottom">
                        <span>{{ a.job_title }} — {{ a.company_name }}</span>
                        <span class="status-badge" :class="'status-' + a.status">{{ a.status }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            students: [],
            loading: true,
            alertMsg: '',
            errorMsg: '',
            searchQuery: '',
            statusFilter: '',
            debounceTimer: null,
            selected: null,
            detailApplications: []
        }
    },
    async mounted() {
        document.title = 'Student Profiles | Placewise'
        await this.loadStudents()
        this.loading = false
    },
    computed: {
        filtered() {
            let list = this.students
            if (this.statusFilter === 'active') list = list.filter(s => s.is_active)
            if (this.statusFilter === 'blacklisted') list = list.filter(s => !s.is_active)
            return list
        }
    },
    methods: {
        onSearch() {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = setTimeout(() => this.loadStudents(), 350)
        },
        async loadStudents() {
            this.loading = true
            const params = new URLSearchParams()
            if (this.searchQuery) params.set('search', this.searchQuery)
            const data = await api(`/api/admin/students?${params.toString()}`)
            if (data && Array.isArray(data)) this.students = data
            this.loading = false
        },
        async openDetail(student) {
            this.selected = student
            this.detailApplications = []
            const data = await api(`/api/admin/students/${student.id}`)
            if (data && data.applications) this.detailApplications = data.applications
        },
        async toggleActive(studentId, currentStatus) {
            this.alertMsg = ''
            this.errorMsg = ''
            const action = currentStatus ? 'blacklist' : 'activate'
            const res = await api(`/api/admin/students/${studentId}/${action}`, { method: 'POST' })
            if (res && !res.error) {
                this.alertMsg = `Student account ${action}d successfully.`
                await this.loadStudents()
            } else {
                this.errorMsg = res ? res.error : `Failed to ${action} student.`
            }
        }
    }
}
