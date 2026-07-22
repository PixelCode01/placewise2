const BrowseDrives = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Placement Drives</h1>
                <p class="text-muted mb-0">Explore campus recruitment opportunities and evaluate eligibility.</p>
            </div>
            <div class="d-flex align-items-center gap-3">
                <div class="form-check form-switch mb-0">
                    <input class="form-check-input" type="checkbox" id="eligible-toggle" v-model="eligibleOnly">
                    <label class="form-check-label small text-muted" for="eligible-toggle">Eligible only</label>
                </div>
                <div style="min-width: 240px;">
                    <input type="text" class="form-control" v-model="searchQuery" placeholder="Search by role or company...">
                </div>
            </div>
        </div>

        <!-- Branch filter chips -->
        <div class="d-flex flex-wrap gap-2 mb-2">
            <span class="filter-chip" :class="{ active: selectedBranch === '' }" @click="selectedBranch = ''">All Branches</span>
            <span
                v-for="branch in branchOptions"
                :key="branch"
                class="filter-chip"
                :class="{ active: selectedBranch === branch }"
                @click="selectedBranch = branch"
            >
                {{ branch }}
            </span>
        </div>

        <!-- Year filter chips -->
        <div class="d-flex flex-wrap gap-2 mb-4">
            <span class="filter-chip" :class="{ active: selectedYear === 0 }" @click="selectedYear = 0">All Years</span>
            <span
                v-for="y in [1, 2, 3, 4]"
                :key="y"
                class="filter-chip"
                :class="{ active: selectedYear === y }"
                @click="selectedYear = y"
            >
                Year {{ y }}
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

        <div v-if="loading" class="text-muted py-4 text-center">Loading recruitment drives...</div>

        <div v-else-if="filteredDrives.length === 0" class="empty-state">
            <h2 class="h4">No drives match your filters</h2>
            <p class="text-muted mb-3">Try clearing your search query or selecting "All Branches".</p>
            <button class="btn btn-outline-secondary btn-sm" @click="searchQuery = ''; selectedBranch = ''">Reset Filters</button>
        </div>

        <div v-else class="row g-4">
            <div v-for="drive in filteredDrives" :key="drive.id" class="col-md-6 col-lg-4">
                <div class="card h-100 d-flex flex-column">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                            <h2 class="h5 card-title mb-0">{{ drive.job_title }}</h2>
                            <span class="status-badge status-approved">Open</span>
                        </div>
                        <p class="text-muted small mb-2">{{ drive.company_name }}</p>

                        <p class="card-text small text-muted flex-grow-1 mb-3" style="line-height: 1.55;">
                            {{ drive.job_description || 'No detailed job description provided.' }}
                        </p>

                        <dl class="row small mb-3 mt-auto p-3 rounded" style="background-color: var(--bg-base); border: 1px solid var(--border-color);">
                            <dt class="col-6 text-muted fw-normal">Branch</dt>
                            <dd class="col-6 text-end fw-medium mb-1">{{ drive.eligibility_branch || 'All' }}</dd>

                            <dt class="col-6 text-muted fw-normal">Min CGPA</dt>
                            <dd class="col-6 text-end fw-medium mb-1">{{ drive.eligibility_cgpa || 'N/A' }}</dd>

                            <dt class="col-6 text-muted fw-normal">Package / CTC</dt>
                            <dd class="col-6 text-end fw-bold mb-1" style="color: var(--accent-forest);">{{ drive.salary || 'Negotiable' }}</dd>

                            <dt class="col-6 text-muted fw-normal">Deadline</dt>
                            <dd class="col-6 text-end fw-medium mb-0">{{ drive.application_deadline }}</dd>
                        </dl>

                        <!-- Ineligibility reasons -->
                        <div v-if="!drive.eligible" class="mb-3 p-2 rounded small" style="background-color: #fff4f4; border: 1px solid #f5c6cb;">
                            <div class="fw-semibold mb-1" style="color: #c0392b;">Not Eligible</div>
                            <ul class="mb-0 ps-3" style="color: #7b2d2d;">
                                <li v-for="reason in drive.ineligible_reasons" :key="reason">{{ reason }}</li>
                            </ul>
                        </div>

                        <!-- ATS Match Result -->
                        <div v-if="atsResults[drive.id]" class="mb-3 p-2 rounded small" style="background-color: var(--accent-forest-light); border: 1px solid #D3EADD;">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="fw-semibold" style="color: var(--accent-forest);">ATS Match Score</span>
                                <span class="fw-bold" style="color: var(--accent-forest);">{{ atsResults[drive.id].match_score }}%</span>
                            </div>
                            <div class="text-muted" style="font-size: 0.78rem;">
                                Matched keywords: {{ atsResults[drive.id].matched_keywords.slice(0, 4).join(', ') || 'None' }}
                            </div>
                        </div>

                        <div class="d-flex gap-2 mt-auto">
                            <button class="btn btn-outline-primary btn-sm flex-grow-1" @click="checkAts(drive.id)" :disabled="checkingAts === drive.id">
                                <span v-if="checkingAts === drive.id" class="spinner-border spinner-border-sm me-1"></span>
                                {{ checkingAts === drive.id ? 'Checking...' : 'Check Match' }}
                            </button>

                            <button
                                v-if="drive.already_applied"
                                class="btn btn-outline-secondary btn-sm flex-grow-1"
                                disabled
                            >
                                Applied
                            </button>
                            <button
                                v-else-if="!drive.eligible"
                                class="btn btn-outline-danger btn-sm flex-grow-1"
                                disabled
                            >
                                Ineligible
                            </button>
                            <button
                                v-else
                                class="btn btn-primary btn-sm flex-grow-1"
                                @click="applyDrive(drive.id)"
                                :disabled="applying === drive.id"
                            >
                                <span v-if="applying === drive.id" class="spinner-border spinner-border-sm me-1"></span>
                                Apply Now
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
            drives: [],
            searchQuery: '',
            selectedBranch: '',
            branchOptions: [
                'Computer Science',
                'Information Technology',
                'Electronics & Communication',
                'Electrical Engineering',
                'Mechanical Engineering',
                'Civil Engineering',
                'Chemical Engineering',
                'Data Science & AI'
            ],
            loading: true,
            alertMsg: '',
            errorMsg: '',
            atsResults: {},
            checkingAts: null,
            applying: null,
            selectedYear: 0,
            eligibleOnly: false
        }
    },
    computed: {
        filteredDrives() {
            let list = this.drives
            if (this.selectedBranch) {
                list = list.filter(d =>
                    !d.eligibility_branch ||
                    d.eligibility_branch.toLowerCase().includes(this.selectedBranch.toLowerCase()) ||
                    d.eligibility_branch.toLowerCase().includes('all')
                )
            }
            if (this.selectedYear) {
                list = list.filter(d =>
                    !d.eligibility_year || d.eligibility_year === this.selectedYear
                )
            }
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase()
                list = list.filter(d =>
                    (d.job_title && d.job_title.toLowerCase().includes(q)) ||
                    (d.company_name && d.company_name.toLowerCase().includes(q))
                )
            }
            if (this.eligibleOnly) list = list.filter(d => d.eligible)
            return list
        }
    },
    async mounted() {
        document.title = 'Browse Drives | Placewise'
        await this.loadDrives()
        this.loading = false
    },
    methods: {
        async loadDrives() {
            const data = await api('/api/student/drives')
            if (data && Array.isArray(data)) this.drives = data
        },
        hasApplied(driveId) {
            const drive = this.drives.find(d => d.id === driveId)
            return drive ? drive.already_applied : false
        },
        async applyDrive(driveId) {
            this.applying = driveId
            this.alertMsg = ''
            this.errorMsg = ''

            const res = await api('/api/student/apply', {
                method: 'POST',
                body: JSON.stringify({ drive_id: driveId })
            })

            this.applying = null

            if (!res) {
                this.errorMsg = 'Failed to submit application. Please try again.'
                return
            }

            if (res.error) {
                this.errorMsg = res.error
                return
            }

            this.alertMsg = res.message || 'Application submitted successfully!'
            const drive = this.drives.find(d => d.id === driveId)
            if (drive) drive.already_applied = true
        },
        async checkAts(driveId) {
            this.checkingAts = driveId
            const res = await api(`/api/student/drives/${driveId}/ats-check`, { method: 'GET' })
            this.checkingAts = null

            if (res && !res.error) {
                this.atsResults[driveId] = res
            } else {
                this.errorMsg = res ? res.error : 'Failed to calculate ATS match.'
            }
        }
    }
}
