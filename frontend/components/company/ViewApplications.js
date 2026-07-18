const ViewApplications = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Applicant Management</h1>
                <p class="text-muted mb-0">Review candidates, run ATS ranking, and update selection status.</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-primary btn-sm" @click="calculateAtsRankings" :disabled="loadingAts">
                    <span v-if="loadingAts" class="spinner-border spinner-border-sm me-1"></span>
                    {{ loadingAts ? 'Analyzing...' : 'Run ATS Ranking' }}
                </button>
                <button class="btn btn-outline-secondary btn-sm" @click="exportCsv" :disabled="exporting">
                    <span v-if="exporting" class="spinner-border spinner-border-sm me-1"></span>
                    {{ exporting ? 'Exporting...' : 'Export CSV' }}
                </button>
                <a v-if="downloadUrl" :href="downloadUrl" download class="btn btn-primary btn-sm">Download CSV</a>
                <router-link to="/company/dashboard" class="btn btn-outline-secondary btn-sm">&larr; Back</router-link>
            </div>
        </div>

        <!-- Status filter -->
        <div class="mb-3 d-flex gap-2 flex-wrap">
            <span
                v-for="s in ['all', 'applied', 'shortlisted', 'interview', 'offer', 'placed', 'rejected']"
                :key="s"
                class="filter-chip"
                :class="{ active: statusFilter === s }"
                @click="statusFilter = s"
            >
                {{ s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1) }}
            </span>
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

        <div v-else-if="filteredApplications.length === 0" class="empty-state">
            <h2 class="h4">No applicants</h2>
            <p class="text-muted mb-0">{{ statusFilter === 'all' ? 'No students have applied yet.' : 'No applicants with status: ' + statusFilter }}</p>
        </div>

        <div v-else class="row g-4">
            <div v-for="app in filteredApplications" :key="app.id" class="col-lg-6">
                <div class="card h-100 p-4">
                    <div class="d-flex justify-content-between align-items-start gap-2 mb-3 pb-2 border-bottom">
                        <div>
                            <h2 class="h5 card-title mb-0">{{ app.student_name }}</h2>
                            <div class="small text-muted">
                                <span v-if="app.student_email">{{ app.student_email }} &bull; </span>
                                <span>Applied {{ app.applied_at ? app.applied_at.substring(0, 10) : '' }}</span>
                            </div>
                        </div>
                        <span class="status-badge" :class="'status-' + app.status">{{ app.status }}</span>
                    </div>

                    <!-- Academic & Profile Metrics -->
                    <div class="row g-2 mb-3 small bg-light p-2 rounded">
                        <div class="col-6 col-sm-4">
                            <span class="text-muted d-block" style="font-size: 0.75rem;">Branch</span>
                            <span class="fw-medium">{{ app.student_branch || '-' }}</span>
                        </div>
                        <div class="col-6 col-sm-4">
                            <span class="text-muted d-block" style="font-size: 0.75rem;">CGPA</span>
                            <span class="fw-medium">{{ app.student_cgpa != null ? app.student_cgpa : '-' }}</span>
                        </div>
                        <div class="col-6 col-sm-4">
                            <span class="text-muted d-block" style="font-size: 0.75rem;">Graduation Year</span>
                            <span class="fw-medium">{{ app.student_year ? 'Year ' + app.student_year : '-' }}</span>
                        </div>
                        <div class="col-6 col-sm-4" v-if="app.student_phone">
                            <span class="text-muted d-block" style="font-size: 0.75rem;">Phone</span>
                            <span>{{ app.student_phone }}</span>
                        </div>
                        <div class="col-6 col-sm-4" v-if="app.student_linkedin">
                            <span class="text-muted d-block" style="font-size: 0.75rem;">LinkedIn</span>
                            <a :href="app.student_linkedin" target="_blank" class="text-decoration-none fw-medium" style="color: var(--accent-forest);">Profile &nearr;</a>
                        </div>
                        <div class="col-6 col-sm-4" v-if="app.resume_path">
                            <span class="text-muted d-block" style="font-size: 0.75rem;">Resume</span>
                            <a :href="app.resume_path" target="_blank" class="fw-medium text-decoration-none" style="color: var(--accent-forest);">View Resume &nearr;</a>
                        </div>
                    </div>

                    <!-- Skills -->
                    <div class="mb-3" v-if="app.student_skills">
                        <span class="small text-muted d-block mb-1">Key Skills</span>
                        <div class="d-flex flex-wrap gap-1">
                            <span
                                v-for="skill in getSkillList(app.student_skills)"
                                :key="skill"
                                class="badge bg-white text-dark border fw-normal py-1 px-2"
                            >
                                {{ skill }}
                            </span>
                        </div>
                    </div>

                    <!-- ATS score -->
                    <div v-if="atsMap[app.student_id]" class="p-2 mb-3 rounded small d-flex justify-content-between align-items-center" style="background-color: #F0F7F4; border: 1px solid #D3EADD;">
                        <span class="fw-semibold" style="color: var(--accent-forest);">ATS Match Score</span>
                        <span class="fw-bold fs-6" style="color: var(--accent-forest);">{{ atsMap[app.student_id].score }}%</span>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small">Feedback &amp; Notes</label>
                        <textarea class="form-control form-control-sm" v-model="app.company_feedback" rows="2" placeholder="Add recruiter evaluation notes..."></textarea>
                    </div>

                    <!-- Interview date (shown when status is interview) -->
                    <div v-if="app.status === 'interview'" class="mb-3">
                        <label class="form-label small">Interview Date &amp; Time</label>
                        <input type="datetime-local" class="form-control form-control-sm" v-model="app.interview_date">
                    </div>

                    <!-- Placement details (shown when status is placed) -->
                    <div v-if="app.status === 'placed'" class="row g-2 mb-3">
                        <div class="col-6">
                            <label class="form-label small">Offered CTC</label>
                            <input type="text" class="form-control form-control-sm" v-model="app.offer_salary" placeholder="e.g. 12 LPA">
                        </div>
                        <div class="col-6">
                            <label class="form-label small">Joining Date</label>
                            <input type="date" class="form-control form-control-sm" v-model="app.joining_date">
                        </div>
                    </div>

                    <div class="row g-2 align-items-end mt-auto pt-2 border-top">
                        <div class="col-sm-7">
                            <label class="form-label small">Update Stage</label>
                            <select class="form-select form-select-sm" v-model="app.status">
                                <option v-for="opt in getNextStages(app.original_status || app.status)" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-sm-5">
                            <button class="btn btn-primary btn-sm w-100" @click="saveStatus(app)" :disabled="saving === app.id">
                                <span v-if="saving === app.id" class="spinner-border spinner-border-sm me-1"></span>
                                Save Status
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            applications: [],
            atsMap: {},
            loading: true,
            loadingAts: false,
            saving: null,
            exporting: false,
            downloadUrl: null,
            alertMsg: '',
            errorMsg: '',
            statusFilter: 'all'
        }
    },
    computed: {
        filteredApplications() {
            let list = Object.keys(this.atsMap).length > 0
                ? [...this.applications].sort((a, b) => {
                    const sa = this.atsMap[a.student_id] ? this.atsMap[a.student_id].score : 0
                    const sb = this.atsMap[b.student_id] ? this.atsMap[b.student_id].score : 0
                    return sb - sa
                })
                : this.applications
            if (this.statusFilter !== 'all') list = list.filter(a => a.status === this.statusFilter)
            return list
        }
    },
    async mounted() {
        document.title = 'Applicant Management | Placewise'
        const driveId = this.$route.params.id
        const data = await api(`/api/company/drives/${driveId}/applications`)
        if (data && Array.isArray(data)) {
            this.applications = data.map(a => ({
                ...a,
                original_status: a.status
            }))
        }
        this.loading = false
    },
    methods: {
        getSkillList(skillsStr) {
            if (!skillsStr) return []
            return skillsStr.split(',').map(s => s.trim()).filter(Boolean)
        },
        getNextStages(currentStatus) {
            const stages = {
                applied: [
                    { value: 'applied', label: 'Applied' },
                    { value: 'shortlisted', label: 'Shortlisted' },
                    { value: 'rejected', label: 'Rejected' }
                ],
                shortlisted: [
                    { value: 'shortlisted', label: 'Shortlisted' },
                    { value: 'interview', label: 'Interview Scheduled' },
                    { value: 'rejected', label: 'Rejected' }
                ],
                interview: [
                    { value: 'interview', label: 'Interview Scheduled' },
                    { value: 'offer', label: 'Offer Extended' },
                    { value: 'rejected', label: 'Rejected' }
                ],
                offer: [
                    { value: 'offer', label: 'Offer Extended' },
                    { value: 'placed', label: 'Placed (Hired)' },
                    { value: 'rejected', label: 'Rejected' }
                ],
                placed: [
                    { value: 'placed', label: 'Placed (Hired)' }
                ],
                rejected: [
                    { value: 'rejected', label: 'Rejected' }
                ]
            }
            return stages[currentStatus] || [{ value: currentStatus, label: currentStatus }]
        },
        async calculateAtsRankings() {
            this.loadingAts = true
            const driveId = this.$route.params.id
            const data = await api(`/api/company/drives/${driveId}/ats-rank`)
            this.loadingAts = false
            if (data && Array.isArray(data)) {
                const map = {}
                data.forEach(item => { map[item.student_id] = item })
                this.atsMap = map
                this.alertMsg = 'Candidates ranked by ATS match score.'
            } else {
                this.errorMsg = data ? data.error : 'Failed to analyze candidates.'
            }
        },
        async exportCsv() {
            this.exporting = true
            this.alertMsg = ''
            this.errorMsg = ''
            this.downloadUrl = null
            const driveId = this.$route.params.id
            const res = await api(`/api/company/drives/${driveId}/export`, { method: 'POST' })
            if (!res || res.error) {
                this.errorMsg = res ? res.error : 'Failed to start export.'
                this.exporting = false
                return
            }
            const taskId = res.task_id
            const poll = setInterval(async () => {
                const s = await api(`/api/company/tasks/${taskId}`)
                if (s && s.state === 'done') {
                    clearInterval(poll)
                    this.exporting = false
                    this.downloadUrl = s.result.file
                    this.alertMsg = 'CSV export ready for download.'
                } else if (s && s.state === 'failed') {
                    clearInterval(poll)
                    this.exporting = false
                    this.errorMsg = 'CSV export task failed.'
                }
            }, 1000)
        },
        async saveStatus(app) {
            this.saving = app.id
            this.alertMsg = ''
            this.errorMsg = ''
            const res = await api(`/api/company/applications/${app.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: app.status,
                    feedback: app.company_feedback,
                    interview_date: app.interview_date || null,
                    salary: app.offer_salary || null,
                    joining_date: app.joining_date || null
                })
            })
            this.saving = null
            if (!res) { this.errorMsg = 'Failed to update application.'; return }
            if (res.error) { this.errorMsg = res.error; return }
            app.original_status = app.status
            this.alertMsg = res.message || 'Status updated successfully.'
        }
    }
}
