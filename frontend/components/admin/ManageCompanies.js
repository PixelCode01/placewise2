const ManageCompanies = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Company Management</h1>
                <p class="text-muted mb-0">Approve recruiter registrations and manage company access.</p>
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
                        id="company-search-input"
                        type="search"
                        class="form-control"
                        placeholder="Search by name, industry, location, or email..."
                        v-model="searchQuery"
                        @input="onSearch"
                    />
                </div>
                <div class="col-md-4">
                    <select id="company-status-filter" class="form-select" v-model="statusFilter" @change="loadCompanies">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading companies...</div>

        <div v-else-if="companies.length === 0" class="empty-state">
            <h2 class="h4">No companies found</h2>
            <p class="text-muted mb-0">Try adjusting your search or filter.</p>
        </div>

        <div v-else class="card">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>Industry</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in companies" :key="c.id" style="cursor:pointer;" @click="openDetail(c)">
                            <td>
                                <div class="fw-medium text-dark">{{ c.name }}</div>
                                <div class="text-muted small">{{ c.hr_email || '-' }}</div>
                            </td>
                            <td class="text-muted">{{ c.industry || '-' }}</td>
                            <td class="text-muted">{{ c.location || '-' }}</td>
                            <td>
                                <span class="status-badge" :class="'status-' + c.approval_status">{{ c.approval_status }}</span>
                            </td>
                            <td class="text-end" @click.stop>
                                <div class="btn-group btn-group-sm">
                                    <button
                                        v-if="c.approval_status !== 'approved'"
                                        class="btn btn-outline-primary"
                                        @click="updateStatus(c.id, 'approve')"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        v-if="c.approval_status !== 'rejected'"
                                        class="btn btn-outline-secondary"
                                        @click="updateStatus(c.id, 'reject')"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        class="btn"
                                        :class="c.is_active ? 'btn-outline-danger' : 'btn-outline-success'"
                                        @click="toggleActive(c.id, c.is_active)"
                                    >
                                        {{ c.is_active ? 'Deactivate' : 'Activate' }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Company detail modal -->
        <div v-if="selected" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.4); z-index: 2000;" @click.self="selected = null">
            <div class="card p-4" style="width: 500px; max-width: 95vw; max-height: 85vh; overflow-y: auto;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h2 class="h5 mb-0">{{ selected.name }}</h2>
                    <button class="btn-close" @click="selected = null"></button>
                </div>
                <dl class="row small mb-3">
                    <dt class="col-5 text-muted">Industry</dt><dd class="col-7">{{ selected.industry || '-' }}</dd>
                    <dt class="col-5 text-muted">Location</dt><dd class="col-7">{{ selected.location || '-' }}</dd>
                    <dt class="col-5 text-muted">Website</dt>
                    <dd class="col-7">
                        <a v-if="selected.website" :href="selected.website" target="_blank">{{ selected.website }}</a>
                        <span v-else>-</span>
                    </dd>
                    <dt class="col-5 text-muted">HR Contact</dt><dd class="col-7">{{ selected.hr_contact || '-' }}</dd>
                    <dt class="col-5 text-muted">HR Email</dt><dd class="col-7">{{ selected.hr_email || '-' }}</dd>
                    <dt class="col-5 text-muted">Status</dt>
                    <dd class="col-7">
                        <span class="status-badge" :class="'status-' + selected.approval_status">{{ selected.approval_status }}</span>
                    </dd>
                    <dt class="col-5 text-muted">Account</dt>
                    <dd class="col-7">
                        <span class="status-badge" :class="selected.is_active ? 'status-approved' : 'status-rejected'">
                            {{ selected.is_active ? 'Active' : 'Deactivated' }}
                        </span>
                    </dd>
                </dl>
                <div v-if="selected.description" class="small text-muted p-3 rounded" style="background: var(--bg-base);">
                    {{ selected.description }}
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            companies: [],
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
        document.title = 'Manage Companies | Placewise'
        await this.loadCompanies()
        this.loading = false
    },
    methods: {
        onSearch() {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = setTimeout(() => this.loadCompanies(), 350)
        },
        async loadCompanies() {
            this.loading = true
            const params = new URLSearchParams()
            if (this.searchQuery) params.set('search', this.searchQuery)
            if (this.statusFilter) params.set('status', this.statusFilter)
            const data = await api(`/api/admin/companies?${params.toString()}`)
            if (data && Array.isArray(data)) this.companies = data
            this.loading = false
        },
        openDetail(company) {
            this.selected = company
        },
        async updateStatus(companyId, action) {
            this.alertMsg = ''
            this.errorMsg = ''
            const res = await api(`/api/admin/companies/${companyId}/${action}`, { method: 'POST' })
            if (res && !res.error) {
                this.alertMsg = `Company ${action}d successfully.`
                await this.loadCompanies()
                if (this.selected && this.selected.id === companyId) this.selected = null
            } else {
                this.errorMsg = res ? res.error : `Failed to ${action} company.`
            }
        },
        async toggleActive(companyId, isActive) {
            const action = isActive ? 'blacklist' : 'activate'
            const res = await api(`/api/admin/companies/${companyId}/${action}`, { method: 'POST' })
            if (res && !res.error) {
                this.alertMsg = `Company ${isActive ? 'deactivated' : 'activated'} successfully.`
                await this.loadCompanies()
            } else {
                this.errorMsg = res ? res.error : 'Failed to update company status.'
            }
        }
    }
}
