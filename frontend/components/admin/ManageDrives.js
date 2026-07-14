const ManageDrives = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Placement Drives</h1>
                <p class="text-muted mb-0">Review eligibility, deadlines, CTCs, and applicant counts.</p>
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
                        id="drive-search-input"
                        type="search"
                        class="form-control"
                        placeholder="Search by role, company, salary, or description..."
                        v-model="searchQuery"
                        @input="onSearch"
                    />
                </div>
                <div class="col-md-4">
                    <select id="drive-status-filter" class="form-select" v-model="statusFilter" @change="loadDrives">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading drives...</div>

        <div v-else-if="drives.length === 0" class="empty-state">
            <h2 class="h4">No drives found</h2>
            <p class="text-muted mb-0">Try adjusting your search or filter.</p>
        </div>

        <div v-else class="card">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Job Role</th>
                            <th>Company</th>
                            <th>Package</th>
                            <th>Deadline</th>
                            <th>Applicants</th>
                            <th>Status</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="d in drives" :key="d.id" style="cursor:pointer;" @click="selected = d">
                            <td class="fw-medium text-dark">{{ d.job_title }}</td>
                            <td class="text-muted">{{ d.company_name }}</td>
                            <td class="text-muted small">{{ d.salary || '-' }}</td>
                            <td class="text-muted small">{{ d.application_deadline }}</td>
                            <td class="fw-bold" style="color: var(--accent-forest);">{{ d.applicant_count }}</td>
                            <td>
                                <span class="status-badge" :class="'status-' + d.status">{{ d.status }}</span>
                            </td>
                            <td class="text-end" @click.stop>
                                <div class="btn-group btn-group-sm">
                                    <button
                                        v-if="d.status === 'pending'"
                                        class="btn btn-outline-primary"
                                        @click="updateStatus(d.id, 'approve')"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        v-if="d.status === 'pending'"
                                        class="btn btn-outline-danger"
                                        @click="updateStatus(d.id, 'reject')"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        v-if="d.status === 'approved'"
                                        class="btn btn-outline-secondary"
                                        @click="updateStatus(d.id, 'close')"
                                    >
                                        Close
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Drive detail modal -->
        <div v-if="selected" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.4); z-index: 2000;" @click.self="selected = null">
            <div class="card p-4" style="width: 520px; max-width: 95vw; max-height: 85vh; overflow-y: auto;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h2 class="h5 mb-0">{{ selected.job_title }}</h2>
                        <span class="text-muted small">{{ selected.company_name }}</span>
                    </div>
                    <button class="btn-close" @click="selected = null"></button>
                </div>
                <dl class="row small mb-3">
                    <dt class="col-5 text-muted">Package / CTC</dt><dd class="col-7 fw-medium">{{ selected.salary || 'Negotiable' }}</dd>
                    <dt class="col-5 text-muted">Application Deadline</dt><dd class="col-7">{{ selected.application_deadline }}</dd>
                    <dt class="col-5 text-muted">Eligible Branches</dt><dd class="col-7">{{ selected.eligibility_branch || 'All Branches' }}</dd>
                    <dt class="col-5 text-muted">Min CGPA</dt><dd class="col-7">{{ selected.eligibility_cgpa || 'None' }}</dd>
                    <dt class="col-5 text-muted">Graduation Year</dt><dd class="col-7">{{ selected.eligibility_year ? 'Year ' + selected.eligibility_year : 'Any' }}</dd>
                    <dt class="col-5 text-muted">Total Applicants</dt><dd class="col-7 fw-bold" style="color: var(--accent-forest);">{{ selected.applicant_count }}</dd>
                    <dt class="col-5 text-muted">Approval Status</dt>
                    <dd class="col-7">
                        <span class="status-badge" :class="'status-' + selected.status">{{ selected.status }}</span>
                    </dd>
                </dl>
                <div class="border-top pt-2" v-if="selected.job_description">
                    <div class="fw-medium small mb-1">Job Description</div>
                    <p class="small text-muted mb-0" style="white-space: pre-line;">{{ selected.job_description }}</p>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            drives: [],
            loading: true,
            alertMsg: '',
            errorMsg: '',
            searchQuery: '',
            statusFilter: '',
            debounceTimer: null,
            selected: null
        }
    },
    async mounted() {
        document.title = 'Placement Drives | Placewise'
        await this.loadDrives()
        this.loading = false
    },
    methods: {
        onSearch() {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = setTimeout(() => this.loadDrives(), 350)
        },
        async loadDrives() {
            this.loading = true
            const params = new URLSearchParams()
            if (this.searchQuery) params.set('search', this.searchQuery)
            if (this.statusFilter) params.set('status', this.statusFilter)
            const data = await api(`/api/admin/drives?${params.toString()}`)
            if (data && Array.isArray(data)) this.drives = data
            this.loading = false
        },
        async updateStatus(driveId, action) {
            this.alertMsg = ''
            this.errorMsg = ''
            const res = await api(`/api/admin/drives/${driveId}/${action}`, { method: 'POST' })
            if (res && !res.error) {
                this.alertMsg = `Drive ${action}d successfully.`
                await this.loadDrives()
            } else {
                this.errorMsg = res ? res.error : `Failed to ${action} drive.`
            }
        }
    }
}
