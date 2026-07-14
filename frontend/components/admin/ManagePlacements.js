const ManagePlacements = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Placement Records</h1>
                <p class="text-muted mb-0">All confirmed placements across companies and drives.</p>
            </div>
            <router-link to="/admin/dashboard" class="btn btn-outline-secondary btn-sm">&larr; Back to Dashboard</router-link>
        </div>

        <div class="card mb-3 p-3">
            <input
                type="search"
                class="form-control"
                placeholder="Search by student name or company..."
                v-model="searchQuery"
            />
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading placements...</div>

        <div v-else-if="filtered.length === 0" class="empty-state">
            <h2 class="h4">No placements found</h2>
            <p class="text-muted mb-0">{{ placements.length === 0 ? 'No students have been marked as placed yet.' : 'No results match your search.' }}</p>
        </div>

        <div v-else class="card">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Company</th>
                            <th>Job Role</th>
                            <th>Salary</th>
                            <th>Joining Date</th>
                            <th>Confirmed On</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="p in filtered" :key="p.id">
                            <td class="fw-medium text-dark">{{ p.student_name }}</td>
                            <td class="text-muted">{{ p.company_name }}</td>
                            <td class="text-muted">{{ p.job_title }}</td>
                            <td class="fw-medium" style="color: var(--accent-forest);">{{ p.salary || '-' }}</td>
                            <td class="text-muted small">{{ p.joining_date || '-' }}</td>
                            <td class="text-muted small">{{ p.confirmed_at ? p.confirmed_at.substring(0, 10) : '-' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `,
    data() {
        return { placements: [], loading: true, searchQuery: '' }
    },
    computed: {
        filtered() {
            if (!this.searchQuery) return this.placements
            const q = this.searchQuery.toLowerCase()
            return this.placements.filter(p =>
                (p.student_name && p.student_name.toLowerCase().includes(q)) ||
                (p.company_name && p.company_name.toLowerCase().includes(q)) ||
                (p.job_title && p.job_title.toLowerCase().includes(q))
            )
        }
    },
    async mounted() {
        document.title = 'Placement Records | Placewise'
        const data = await api('/api/admin/placements')
        if (data && Array.isArray(data)) this.placements = data
        this.loading = false
    }
}
