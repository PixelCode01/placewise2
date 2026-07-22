const MyApplications = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">My Applications</h1>
                <p class="text-muted mb-0">Track your recruitment applications and interview schedules.</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-secondary btn-sm" @click="exportCsv" :disabled="exporting">
                    <span v-if="exporting" class="spinner-border spinner-border-sm me-1"></span>
                    {{ exporting ? 'Exporting CSV...' : 'Export Applications CSV' }}
                </button>
                <a v-if="downloadUrl" :href="downloadUrl" download class="btn btn-primary btn-sm">
                    Download CSV
                </a>
                <router-link to="/student/drives" class="btn btn-primary btn-sm">+ Apply to New Drives</router-link>
            </div>
        </div>

        <div v-if="alertMsg" class="alert alert-success alert-dismissible fade show" role="alert">
            {{ alertMsg }}
            <button type="button" class="btn-close" @click="alertMsg = ''"></button>
        </div>
        <div v-if="errorMsg" class="alert alert-danger alert-dismissible fade show" role="alert">
            {{ errorMsg }}
            <button type="button" class="btn-close" @click="errorMsg = ''"></button>
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading applications...</div>

        <div v-else-if="applications.length === 0" class="empty-state">
            <h2 class="h4">No applications submitted</h2>
            <p class="text-muted mb-3">You have not applied for any placement drives yet.</p>
            <router-link to="/student/drives" class="btn btn-primary btn-sm">Explore Open Drives</router-link>
        </div>

        <div v-else class="card">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Job Role</th>
                            <th>Company</th>
                            <th>Applied Date</th>
                            <th>Interview Date</th>
                            <th>Status</th>
                            <th>Feedback / Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="app in applications" :key="app.id">
                            <td class="fw-medium text-dark">
                                {{ app.job_title }}
                                <div v-if="app.placement" class="small mt-1 fw-normal" style="color: var(--accent-forest);">
                                    <span>Package: <strong>{{ app.placement.salary || 'Standard' }}</strong></span>
                                    <span v-if="app.placement.joining_date" class="ms-2">&middot; Joining: {{ app.placement.joining_date }}</span>
                                </div>
                            </td>
                            <td class="text-muted">{{ app.company_name }}</td>
                            <td class="text-muted small">{{ app.applied_at ? app.applied_at.substring(0, 10) : '' }}</td>
                            <td class="text-muted small">{{ app.interview_date ? app.interview_date.substring(0, 16).replace('T', ' ') : '-' }}</td>
                            <td>
                                <span class="status-badge" :class="'status-' + app.status">{{ app.status }}</span>
                            </td>
                            <td class="small text-muted">{{ app.company_feedback || '-' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            applications: [],
            loading: true,
            exporting: false,
            downloadUrl: null,
            alertMsg: '',
            errorMsg: ''
        }
    },
    async mounted() {
        document.title = 'My Applications | Placewise'
        const data = await api('/api/student/applications')
        if (data && Array.isArray(data)) this.applications = data
        this.loading = false
    },
    methods: {
        async exportCsv() {
            this.exporting = true
            this.alertMsg = ''
            this.errorMsg = ''
            this.downloadUrl = null

            const res = await api('/api/student/applications/export', { method: 'POST' })
            if (!res || res.error) {
                this.errorMsg = res ? res.error : 'Failed to start CSV export.'
                this.exporting = false
                return
            }

            const taskId = res.task_id
            const pollInterval = setInterval(async () => {
                const statusRes = await api(`/api/student/tasks/${taskId}`)
                if (statusRes && statusRes.state === 'done') {
                    clearInterval(pollInterval)
                    this.exporting = false
                    this.downloadUrl = statusRes.result.file
                    this.alertMsg = 'CSV export ready for download.'
                } else if (statusRes && statusRes.state === 'failed') {
                    clearInterval(pollInterval)
                    this.exporting = false
                    this.errorMsg = 'CSV export task failed.'
                }
            }, 1000)
        }
    }
}
