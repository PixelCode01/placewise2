const EditCompanyProfile = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Company Profile</h1>
                <p class="text-muted mb-0">Keep your company details up to date for students and admin.</p>
            </div>
            <router-link to="/company/dashboard" class="btn btn-outline-secondary btn-sm">&larr; Back to Dashboard</router-link>
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading profile...</div>

        <div v-else class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card p-4 p-md-5">
                    <div v-if="success" class="alert alert-success py-2 small mb-3">{{ success }}</div>
                    <div v-if="error" class="alert alert-danger py-2 small mb-3">{{ error }}</div>

                    <form @submit.prevent="save">
                        <div class="mb-3">
                            <label class="form-label" for="cp-name">Company Name *</label>
                            <input type="text" class="form-control" id="cp-name" v-model="profile.name" required>
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label" for="cp-industry">Industry</label>
                                <input type="text" class="form-control" id="cp-industry" v-model="profile.industry" placeholder="e.g. Cloud Computing">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="cp-location">Location</label>
                                <input type="text" class="form-control" id="cp-location" v-model="profile.location" placeholder="e.g. Bangalore, India">
                            </div>
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label" for="cp-hr-contact">HR Contact Name</label>
                                <input type="text" class="form-control" id="cp-hr-contact" v-model="profile.hr_contact">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="cp-hr-email">HR Email</label>
                                <input type="email" class="form-control" id="cp-hr-email" v-model="profile.hr_email">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label" for="cp-website">Website</label>
                            <input type="url" class="form-control" id="cp-website" v-model="profile.website" placeholder="https://yourcompany.com">
                        </div>

                        <div class="mb-4">
                            <label class="form-label" for="cp-description">About the Company</label>
                            <textarea class="form-control" id="cp-description" v-model="profile.description" rows="4" placeholder="Brief description of your company and what you do..."></textarea>
                        </div>

                        <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                            <router-link to="/company/dashboard" class="btn btn-outline-secondary">Cancel</router-link>
                            <button type="submit" class="btn btn-primary" :disabled="saving">
                                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                                {{ saving ? 'Saving...' : 'Save Profile' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            profile: { name: '', industry: '', location: '', website: '', hr_contact: '', hr_email: '', description: '' },
            loading: true,
            saving: false,
            error: '',
            success: ''
        }
    },
    async mounted() {
        document.title = 'Company Profile | Placewise'
        const data = await api('/api/company/profile')
        if (data && !data.error) this.profile = data
        this.loading = false
    },
    methods: {
        async save() {
            this.saving = true
            this.error = ''
            this.success = ''
            const res = await api('/api/company/profile', {
                method: 'PUT',
                body: JSON.stringify(this.profile)
            })
            this.saving = false
            if (!res || res.error) { this.error = res ? res.error : 'Failed to save profile.'; return }
            this.success = 'Profile updated successfully.'
        }
    }
}
