const AdminDashboard = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Admin Dashboard</h1>
                <p class="text-muted mb-0">Manage drives, companies, students, and placement analytics.</p>
            </div>
            <div class="d-flex gap-2">
                <router-link to="/admin/companies" class="btn btn-outline-secondary btn-sm">Companies</router-link>
                <router-link to="/admin/students" class="btn btn-outline-secondary btn-sm">Students</router-link>
                <router-link to="/admin/drives" class="btn btn-outline-secondary btn-sm">Drives</router-link>
                <router-link to="/admin/placements" class="btn btn-outline-secondary btn-sm">Placements</router-link>
            </div>
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading dashboard data...</div>

        <div v-else>
            <!-- Stat Cards matching SummitDesk -->
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body py-3">
                            <p class="stat-num">{{ stats.total_students }}</p>
                            <p class="stat-label">Students</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body py-3">
                            <p class="stat-num">{{ stats.total_companies }}</p>
                            <p class="stat-label">Companies</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body py-3">
                            <p class="stat-num">{{ stats.total_drives }}</p>
                            <p class="stat-label">Drives</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body py-3">
                            <p class="stat-num">{{ stats.total_applications }}</p>
                            <p class="stat-label">Applications</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body py-3">
                            <p class="stat-num">{{ stats.total_placed || 0 }}</p>
                            <p class="stat-label">Placed</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-2">
                    <div class="card stat-card h-100">
                        <div class="card-body py-3">
                            <p class="stat-num">{{ stats.pending_companies || 0 }}</p>
                            <p class="stat-label">Pending Co.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pending Review Warnings -->
            <div v-if="stats.pending_companies > 0 || stats.pending_drives > 0" class="alert alert-warning mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <strong>Action Required:</strong>
                    <span v-if="stats.pending_companies > 0"> {{ stats.pending_companies }} company account(s) pending approval.</span>
                    <span v-if="stats.pending_drives > 0"> {{ stats.pending_drives }} placement drive(s) pending review.</span>
                </div>
                <div class="d-flex gap-2">
                    <router-link v-if="stats.pending_companies > 0" to="/admin/companies" class="btn btn-sm btn-outline-primary">Review Companies</router-link>
                    <router-link v-if="stats.pending_drives > 0" to="/admin/drives" class="btn btn-sm btn-outline-primary">Review Drives</router-link>
                </div>
            </div>

            <!-- Quick Management Navigation Cards -->
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <router-link class="card shadow-sm text-decoration-none h-100" to="/admin/companies">
                        <div class="card-body">
                            <h2 class="h5 card-title mb-1">Company Management</h2>
                            <p class="text-muted small mb-0">Approve recruiters, view job listings, and manage account statuses.</p>
                        </div>
                    </router-link>
                </div>
                <div class="col-md-3">
                    <router-link class="card shadow-sm text-decoration-none h-100" to="/admin/students">
                        <div class="card-body">
                            <h2 class="h5 card-title mb-1">Student Profiles</h2>
                            <p class="text-muted small mb-0">Verify resumes, academic performance (CGPA), and placement status.</p>
                        </div>
                    </router-link>
                </div>
                <div class="col-md-3">
                    <router-link class="card shadow-sm text-decoration-none h-100" to="/admin/drives">
                        <div class="card-body">
                            <h2 class="h5 card-title mb-1">Placement Drives</h2>
                            <p class="text-muted small mb-0">Review drive eligibility, deadlines, CTCs, and applicant counts.</p>
                        </div>
                    </router-link>
                </div>
                <div class="col-md-3">
                    <router-link class="card shadow-sm text-decoration-none h-100" to="/admin/placements">
                        <div class="card-body">
                            <h2 class="h5 card-title mb-1">Placement Records</h2>
                            <p class="text-muted small mb-0">View all confirmed placements, salary offers, and joining dates.</p>
                        </div>
                    </router-link>
                </div>
            </div>
            </div>

            <!-- Charts Section -->
            <div class="row g-4">
                <div class="col-md-7">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Applications Per Drive</h5>
                            <div style="position: relative; height: 220px; width: 100%;">
                                <canvas id="driveApplicationsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Student Placement Status</h5>
                            <div style="position: relative; height: 220px; width: 100%;">
                                <canvas id="studentStatusChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return { stats: {}, loading: true, charts: {} }
    },
    async mounted() {
        document.title = 'Admin Dashboard | Placewise'
        const data = await api('/api/admin/dashboard')
        if (data) this.stats = data
        this.loading = false
        
        this.$nextTick(() => {
            this.loadChartData()
        })
    },
    methods: {
        async loadChartData() {
            try {
                const response = await api('/api/admin/stats/charts', { method: 'GET' });
                if (response && !response.error) {
                    this.renderPieChart(response.student_status);
                    this.renderBarChart(response.drive_applications);
                }
            } catch (err) {
                console.error("Failed to load charts", err);
            }
        },
        renderPieChart(data) {
            const ctx = document.getElementById('studentStatusChart');
            if (!ctx) return;
            if (this.charts.pie) this.charts.pie.destroy();
            this.charts.pie = new Chart(ctx, {
                type: 'doughnut', 
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.data,
                        backgroundColor: ['#2A4737', '#C26D5C', '#E8E4DD'],
                        borderWidth: 2,
                        borderColor: '#FFFFFF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 12, font: { family: 'Outfit', size: 12 } }
                        }
                    }
                }
            });
        },
        renderBarChart(data) {
            const ctx = document.getElementById('driveApplicationsChart');
            if (!ctx) return;
            if (this.charts.bar) this.charts.bar.destroy();
            this.charts.bar = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Applications',
                        data: data.data,
                        backgroundColor: 'rgba(42, 71, 55, 0.75)',
                        borderColor: '#2A4737',
                        borderWidth: 1,
                        borderRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, font: { family: 'Outfit', size: 11 } },
                            grid: { color: '#E8E4DD' }
                        },
                        x: {
                            ticks: { font: { family: 'Outfit', size: 11 } },
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }
}
