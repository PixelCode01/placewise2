const CompanyDashboard = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Company Dashboard</h1>
                <p class="text-muted mb-0">Manage your recruitment drives and candidate evaluation.</p>
            </div>
            <div class="d-flex gap-2">
                <router-link to="/company/profile" class="btn btn-outline-secondary btn-sm">Edit Profile</router-link>
                <router-link to="/company/drives/create" class="btn btn-primary btn-sm">
                    + Post New Drive
                </router-link>
            </div>
        </div>

        <div v-if="pendingApproval" class="alert alert-warning">
            <strong>Pending Approval</strong> — Your account is under review by the admin. You can post drives once approved.
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading drives...</div>

        <div v-else-if="drives.length === 0" class="empty-state">
            <h2 class="h4">No drives posted yet</h2>
            <p class="text-muted mb-3">Create your first campus placement drive to start receiving applications.</p>
            <router-link to="/company/drives/create" class="btn btn-primary btn-sm">Post Placement Drive</router-link>
        </div>

        <div v-else class="row g-4">
            <div v-for="drive in drives" :key="drive.id" class="col-md-6 col-lg-4">
                <div class="card h-100 d-flex flex-column">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <h2 class="h5 card-title mb-0">{{ drive.job_title }}</h2>
                            <span class="status-badge" :class="'status-' + drive.status">{{ drive.status }}</span>
                        </div>

                        <p class="card-text small text-muted flex-grow-1 mb-3">
                            {{ drive.job_description || 'No detailed job description.' }}
                        </p>

                        <dl class="row small mb-3 mt-auto p-3 rounded" style="background-color: var(--bg-base); border: 1px solid var(--border-color);">
                            <dt class="col-6 text-muted font-normal">Package / CTC</dt>
                            <dd class="col-6 text-end fw-medium mb-1">{{ drive.salary || 'Negotiable' }}</dd>

                            <dt class="col-6 text-muted font-normal">Deadline</dt>
                            <dd class="col-6 text-end fw-medium mb-1">{{ drive.application_deadline }}</dd>

                            <dt class="col-6 text-muted font-normal">Applicants</dt>
                            <dd class="col-6 text-end fw-bold mb-0" style="color: var(--accent-forest);">{{ drive.applicant_count }}</dd>
                        </dl>

                        <router-link :to="'/company/drives/' + drive.id + '/applications'" class="btn btn-outline-primary btn-sm w-100"
                            :class="drive.status === 'pending' ? 'disabled' : ''"
                        >
                            Review Applicants &rarr;
                        </router-link>
                        <button
                            v-if="drive.status === 'approved'"
                            class="btn btn-outline-secondary btn-sm w-100 mt-2"
                            @click="closeDrive(drive.id)"
                            :disabled="closing === drive.id"
                        >
                            <span v-if="closing === drive.id" class="spinner-border spinner-border-sm me-1"></span>
                            Close Drive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            drives: [],
            loading: true,
            closing: null,
            pendingApproval: false
        }
    },
    async mounted() {
        document.title = 'Company Dashboard | Placewise'
        const data = await api('/api/company/drives')
        if (data && Array.isArray(data)) {
            this.drives = data
        } else if (data && data.error && data.error.includes('pending')) {
            this.pendingApproval = true
        }
        this.loading = false
    },
    methods: {
        async closeDrive(driveId) {
            this.closing = driveId
            const res = await api(`/api/company/drives/${driveId}/close`, { method: 'PATCH' })
            this.closing = null
            if (res && !res.error) {
                const drive = this.drives.find(d => d.id === driveId)
                if (drive) drive.status = 'closed'
            }
        }
    }
}
