const Landing = {
    template: `
    <div>
        <!-- Hero Section -->
        <div class="container pt-4">
            <div class="hero-section">
                <img src="assets/images/hero.png?v=4" alt="Campus Placement" class="hero-img">
                <div class="hero-overlay">
                    <div class="hero-text">
                        <p class="hero-sub">Training & Placement Cell</p>
                        <h1 class="hero-title">Find Your Next Career Opportunity</h1>
                        <div class="d-flex flex-wrap gap-3">
                            <router-link to="/login" class="btn btn-light hero-cta">Student & Recruiter Login</router-link>
                            <router-link to="/register" class="btn btn-outline-light">New Registration</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container pb-5">
            <!-- Stat Cards -->
            <div class="row g-3 mb-5" v-if="stats">
                <div class="col-6 col-md-3">
                    <div class="card stat-card">
                        <div class="card-body py-2">
                            <p class="stat-num">{{ stats.total_students }}</p>
                            <p class="stat-label">Registered Students</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card stat-card">
                        <div class="card-body py-2">
                            <p class="stat-num">{{ stats.total_companies }}</p>
                            <p class="stat-label">Verified Companies</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card stat-card">
                        <div class="card-body py-2">
                            <p class="stat-num">{{ stats.total_placed }}</p>
                            <p class="stat-label">Students Placed</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card stat-card">
                        <div class="card-body py-2">
                            <p class="stat-num">{{ stats.active_drives }}</p>
                            <p class="stat-label">Active Drives</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Role Portals Grid -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 class="h4 mb-0">Portal Access</h2>
                    <p class="text-muted small mb-0">Select your portal role to access drives, profiles, and administrative tools.</p>
                </div>
            </div>

            <div class="row g-4 mb-5">
                <div class="col-md-4">
                    <div class="card h-100 p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h3 class="h5 card-title mb-0">Student Portal</h3>
                            <span class="status-badge status-approved">Candidate</span>
                        </div>
                        <p class="card-text small flex-grow-1">
                            Browse verified campus drives, maintain your profile with technical skills, test ATS keyword matching against job requirements, and track application milestones.
                        </p>
                        <div class="mt-3 pt-3 border-top d-flex gap-2">
                            <router-link to="/login" class="btn btn-primary btn-sm flex-grow-1">Student Login</router-link>
                            <router-link to="/register" class="btn btn-outline-secondary btn-sm">Register</router-link>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card h-100 p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h3 class="h5 card-title mb-0">Recruiter Portal</h3>
                            <span class="status-badge status-pending">Employer</span>
                        </div>
                        <p class="card-text small flex-grow-1">
                            Create recruitment drives, define branch and CGPA eligibility, screen candidate resumes with ATS keyword matching, and manage interview schedules.
                        </p>
                        <div class="mt-3 pt-3 border-top d-flex gap-2">
                            <router-link to="/login" class="btn btn-primary btn-sm flex-grow-1">Recruiter Login</router-link>
                            <router-link to="/register" class="btn btn-outline-secondary btn-sm">Sign Up</router-link>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card h-100 p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h3 class="h5 card-title mb-0">Placement Cell</h3>
                            <span class="status-badge status-applied">Admin</span>
                        </div>
                        <p class="card-text small flex-grow-1">
                            Authorize new recruiter registrations, verify drive postings, monitor campus placement analytics, and export student placement reports.
                        </p>
                        <div class="mt-3 pt-3 border-top">
                            <router-link to="/login" class="btn btn-outline-primary btn-sm w-100">Officer Sign In</router-link>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recruitment Process Overview -->
            <div class="card p-4">
                <h3 class="h5 card-title mb-1">Campus Placement Process</h3>
                <p class="text-muted small mb-4">Three simple steps to connect students with recruiting organizations.</p>

                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="p-3 rounded h-100" style="background-color: var(--bg-base); border: 1px solid var(--border-color);">
                            <div class="fw-bold fs-6 mb-1 text-dark">1. Profile & Verification</div>
                            <p class="small text-muted mb-0">
                                Students complete academic profiles and list skills. Placement officers verify company credentials.
                            </p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded h-100" style="background-color: var(--bg-base); border: 1px solid var(--border-color);">
                            <div class="fw-bold fs-6 mb-1 text-dark">2. Drive Posting & ATS Screening</div>
                            <p class="small text-muted mb-0">
                                Recruiters post placement drives. Candidates check their automated ATS resume match before applying.
                            </p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded h-100" style="background-color: var(--bg-base); border: 1px solid var(--border-color);">
                            <div class="fw-bold fs-6 mb-1 text-dark">3. Interviews & Offers</div>
                            <p class="small text-muted mb-0">
                                Shortlisted candidates receive interview slots and final placement offers recorded directly in the portal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return { stats: null }
    },
    async mounted() {
        document.title = 'Placewise | Campus Placement Portal'
        const data = await fetch('/api/auth/public/stats').then(r => r.json())
        if (!data.error) this.stats = data
    }
}
