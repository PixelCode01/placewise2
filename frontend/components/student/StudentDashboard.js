const StudentDashboard = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Student Dashboard</h1>
                <p class="text-muted mb-0">Overview of your profile, eligibility, and active applications.</p>
            </div>
            <div class="d-flex gap-2">
                <router-link to="/student/drives" class="btn btn-primary btn-sm">Browse Drives</router-link>
                <router-link to="/student/profile" class="btn btn-outline-secondary btn-sm">Edit Profile</router-link>
            </div>
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading dashboard...</div>

        <div v-else class="row g-4">
            <!-- Placed banner -->
            <div v-if="placedApplication" class="col-12">
                <div class="alert mb-0" style="background: var(--accent-forest-light); border: 1px solid #D3EADD;">
                    <div class="fw-semibold" style="color: var(--accent-forest);">Congratulations! You have been placed.</div>
                    <div class="small text-muted">{{ placedApplication.job_title }} at {{ placedApplication.company_name }}</div>
                </div>
            </div>
            <!-- Left: Profile Summary -->
            <div class="col-lg-4">
                <div class="card h-100 p-4">
                    <h2 class="h5 card-title mb-3">Academic Profile</h2>
                    
                    <div class="mb-3 pb-3 border-bottom">
                        <div class="fw-bold fs-6 text-dark">{{ profile.full_name }}</div>
                        <div class="text-muted small">{{ profile.email }}</div>
                    </div>

                    <dl class="row small mb-4">
                        <dt class="col-5 text-muted font-normal">Branch</dt>
                        <dd class="col-7 text-end fw-medium">{{ profile.branch || 'Not Set' }}</dd>

                        <dt class="col-5 text-muted font-normal">CGPA</dt>
                        <dd class="col-7 text-end fw-medium">{{ profile.cgpa || 'N/A' }}</dd>

                        <dt class="col-5 text-muted font-normal">Year</dt>
                        <dd class="col-7 text-end fw-medium">{{ profile.year ? 'Year ' + profile.year : 'N/A' }}</dd>

                        <dt class="col-5 text-muted font-normal">Phone</dt>
                        <dd class="col-7 text-end fw-medium">{{ profile.phone || 'N/A' }}</dd>
                    </dl>

                    <div class="mb-3">
                        <div class="fw-medium text-dark small mb-2">Registered Skills</div>
                        <div v-if="profile.skills" class="d-flex flex-wrap gap-1">
                            <span v-for="skill in skillsList" :key="skill" class="status-badge status-applied">
                                {{ skill }}
                            </span>
                        </div>
                        <div v-else class="text-muted small">No skills added yet.</div>
                    </div>

                    <div class="mb-3 small">
                        <span class="text-muted">Resume: </span>
                        <a v-if="profile.resume_path" :href="profile.resume_path" target="_blank" class="fw-medium" style="color: var(--accent-forest);">View uploaded resume</a>
                        <router-link v-else to="/student/profile" class="text-muted">Not uploaded — add one</router-link>
                    </div>

                    <div v-if="profile.linkedin" class="mb-3 small">
                        <span class="text-muted">LinkedIn: </span>
                        <a :href="profile.linkedin" target="_blank" class="fw-medium" style="color: var(--accent-forest);">View Profile</a>
                    </div>

                    <div class="mt-auto pt-3 border-top">
                        <router-link to="/student/profile" class="btn btn-outline-primary btn-sm w-100">
                            Update Resume & Skills
                        </router-link>
                    </div>
                </div>
            </div>

            <!-- Right: Applications Overview -->
            <div class="col-lg-8">
                <div class="card h-100">
                    <div class="card-header-clean d-flex justify-content-between align-items-center">
                        <span>My Placement Applications</span>
                        <router-link to="/student/applications" class="small fw-normal text-decoration-none" style="color: var(--accent-forest);">View All &rarr;</router-link>
                    </div>
                    <div class="card-body p-0">
                        <div v-if="applications.length === 0" class="empty-state m-3">
                            <h2 class="h5">No applications submitted</h2>
                            <p class="text-muted small mb-3">You haven't applied for any recruitment drives yet.</p>
                            <router-link to="/student/drives" class="btn btn-primary btn-sm">Explore Open Drives</router-link>
                        </div>

                        <div v-else class="table-responsive">
                            <table class="table align-middle">
                                <thead>
                                    <tr>
                                        <th>Job Role</th>
                                        <th>Company</th>
                                        <th>Applied Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="app in applications" :key="app.id">
                                        <td class="fw-medium text-dark">{{ app.job_title }}</td>
                                        <td class="text-muted">{{ app.company_name }}</td>
                                        <td class="text-muted small">{{ app.applied_at ? app.applied_at.substring(0, 10) : '' }}</td>
                                        <td>
                                            <span class="status-badge" :class="'status-' + app.status">
                                                {{ app.status }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            profile: {},
            applications: [],
            loading: true
        }
    },
    computed: {
        skillsList() {
            if (!this.profile.skills) return []
            return this.profile.skills.split(',').map(s => s.trim()).filter(Boolean)
        },
        placedApplication() {
            return this.applications.find(a => a.status === 'placed') || null
        }
    },
    async mounted() {
        document.title = 'Student Dashboard | Placewise'
        const [profData, appsData] = await Promise.all([
            api('/api/student/profile'),
            api('/api/student/applications')
        ])

        if (profData && !profData.error) this.profile = profData
        if (appsData && Array.isArray(appsData)) this.applications = appsData
        this.loading = false
    }
}
