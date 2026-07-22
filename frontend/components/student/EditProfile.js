const EditProfile = {
    template: `
    <div class="container py-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h1 class="h2 mb-1">Student Profile</h1>
                <p class="text-muted mb-0">Update your academic information, skills, and resume for campus placement drives.</p>
            </div>
            <router-link to="/student/dashboard" class="btn btn-outline-secondary btn-sm">&larr; Back to Dashboard</router-link>
        </div>

        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card p-4 p-md-5">
                    <div v-if="success" class="alert alert-success py-2 small mb-3">{{ success }}</div>
                    <div v-if="error" class="alert alert-danger py-2 small mb-3">{{ error }}</div>

                    <form @submit.prevent="saveProfile">
                        <div class="mb-3">
                            <label class="form-label" for="prof-name">Full Name *</label>
                            <input type="text" class="form-control" v-model="profile.full_name" required id="prof-name">
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-5">
                                <label class="form-label" for="prof-branch">Branch</label>
                                <select class="form-select" v-model="profile.branch" id="prof-branch">
                                    <option value="" disabled>Select Branch</option>
                                    <option value="Computer Science">Computer Science (CSE)</option>
                                    <option value="Information Technology">Information Technology (IT)</option>
                                    <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                                    <option value="Electrical Engineering">Electrical Engineering (EE)</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                                    <option value="Civil Engineering">Civil Engineering (CE)</option>
                                    <option value="Chemical Engineering">Chemical Engineering (CHE)</option>
                                    <option value="Data Science & AI">Data Science & AI</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label" for="prof-cgpa">CGPA</label>
                                <input type="number" step="0.01" min="0" max="10" class="form-control" v-model="profile.cgpa" placeholder="e.g. 8.5" id="prof-cgpa">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label" for="prof-year">Current Year</label>
                                <input type="number" min="1" max="5" class="form-control" v-model="profile.year" placeholder="4" id="prof-year">
                            </div>
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label" for="prof-phone">Phone Number</label>
                                <input type="tel" class="form-control" v-model="profile.phone" placeholder="+91 9876543210" id="prof-phone">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="prof-linkedin">LinkedIn URL</label>
                                <input type="url" class="form-control" v-model="profile.linkedin" placeholder="https://linkedin.com/in/username" id="prof-linkedin">
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="form-label" for="prof-skills">Technical Skills</label>
                            <input type="text" class="form-control" v-model="profile.skills" placeholder="Comma separated, e.g. Python, SQL, React, Docker, Git" id="prof-skills">
                            
                            <!-- Skill suggestions -->
                            <div class="mt-2">
                                <span class="text-muted small me-2">Quick add:</span>
                                <div class="d-inline-flex flex-wrap gap-1">
                                    <button
                                        v-for="s in suggestedSkills"
                                        :key="s"
                                        type="button"
                                        class="btn btn-outline-secondary btn-sm py-0 px-2"
                                        style="font-size: 0.78rem;"
                                        @click="addSkill(s)"
                                    >
                                        + {{ s }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                            <router-link to="/student/dashboard" class="btn btn-outline-secondary">Cancel</router-link>
                            <button type="submit" class="btn btn-primary" :disabled="saving">
                                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                                {{ saving ? 'Saving Changes...' : 'Save Profile' }}
                            </button>
                        </div>
                    </form>

                    <hr class="my-4">

                    <div>
                        <h2 class="h5 mb-1">Resume</h2>
                        <p class="text-muted small mb-3">Upload a PDF, DOC, or DOCX file. This will be visible to recruiters when you apply.</p>

                        <div v-if="profile.resume_path" class="mb-3 p-3 rounded d-flex align-items-center gap-3" style="background: var(--bg-base); border: 1px solid var(--border-color);">
                            <span class="text-muted small">Current resume:</span>
                            <a :href="profile.resume_path" target="_blank" class="fw-medium small">View uploaded resume</a>
                        </div>

                        <div v-if="resumeSuccess" class="alert alert-success py-2 small mb-3">{{ resumeSuccess }}</div>
                        <div v-if="resumeError" class="alert alert-danger py-2 small mb-3">{{ resumeError }}</div>

                        <div class="d-flex align-items-center gap-3">
                            <input
                                type="file"
                                id="resume-file-input"
                                class="form-control"
                                accept=".pdf,.doc,.docx"
                                @change="onFileChange"
                                style="max-width: 320px;"
                            >
                            <button
                                class="btn btn-outline-primary btn-sm"
                                @click="uploadResume"
                                :disabled="!resumeFile || uploadingResume"
                            >
                                <span v-if="uploadingResume" class="spinner-border spinner-border-sm me-1"></span>
                                {{ uploadingResume ? 'Uploading...' : 'Upload' }}
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
            profile: {
                full_name: '', branch: '', cgpa: '', year: '',
                phone: '', linkedin: '', skills: ''
            },
            suggestedSkills: ['Python', 'SQL', 'JavaScript', 'React', 'Docker', 'Machine Learning', 'Git', 'Java', 'Flask'],
            loading: true,
            saving: false,
            error: '',
            success: '',
            resumeFile: null,
            uploadingResume: false,
            resumeError: '',
            resumeSuccess: ''
        }
    },
    async mounted() {
        document.title = 'Student Profile | Placewise'
        const data = await api('/api/student/profile')
        if (data && !data.error) this.profile = data
        this.loading = false
    },
    methods: {
        addSkill(skill) {
            const current = (this.profile.skills || '').split(',').map(s => s.trim()).filter(Boolean)
            if (!current.includes(skill)) {
                current.push(skill)
                this.profile.skills = current.join(', ')
            }
        },
        async saveProfile() {
            this.saving = true
            this.error = ''
            this.success = ''

            const body = {
                ...this.profile,
                cgpa: this.profile.cgpa ? parseFloat(this.profile.cgpa) : null,
                year: this.profile.year ? parseInt(this.profile.year) : null
            }

            const data = await api('/api/student/profile', {
                method: 'PUT',
                body: JSON.stringify(body)
            })

            this.saving = false

            if (!data) { this.error = 'Failed to update profile.'; return }
            if (data.error) { this.error = data.error; return }

            this.success = 'Profile updated successfully.'
        },
        onFileChange(e) {
            this.resumeFile = e.target.files[0] || null
        },
        async uploadResume() {
            if (!this.resumeFile) return
            this.uploadingResume = true
            this.resumeError = ''
            this.resumeSuccess = ''

            const form = new FormData()
            form.append('resume', this.resumeFile)

            const token = localStorage.getItem('token')
            const res = await fetch('/api/student/profile/resume', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form
            }).then(r => r.json()).catch(() => null)

            this.uploadingResume = false

            if (!res || res.error) {
                this.resumeError = res ? res.error : 'Upload failed. Please try again.'
                return
            }

            this.resumeSuccess = 'Resume uploaded successfully.'
            this.profile.resume_path = res.resume_path
            this.resumeFile = null
            document.getElementById('resume-file-input').value = ''
        }
    }
}
