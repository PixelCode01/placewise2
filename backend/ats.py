def run_ats_check(student, drive):
    matched = []
    missing = []
    total = 0
    hits = 0

    if drive.job_description:
        student_skills = [s.strip().lower() for s in (student.skills or '').split(',') if s.strip()]
        job_text = drive.job_description.lower()

        skill_keywords = extract_keywords(job_text)
        total = len(skill_keywords)

        for kw in skill_keywords:
            found = any(kw in s for s in student_skills) or kw in job_text
            if any(kw in s for s in student_skills):
                matched.append(kw)
                hits += 1
            else:
                missing.append(kw)

    score = round((hits / total) * 100) if total > 0 else 0

    eligibility_ok = True
    eligibility_notes = []
    if drive.eligibility_cgpa and (student.cgpa is None or student.cgpa < drive.eligibility_cgpa):
        eligibility_ok = False
        eligibility_notes.append(f'CGPA below minimum ({drive.eligibility_cgpa})')
    if drive.eligibility_branch:
        branch_str = drive.eligibility_branch.strip()
        if 'all' not in branch_str.lower() and 'any' not in branch_str.lower():
            allowed = [b.strip().lower() for b in branch_str.split(',') if b.strip()]
            student_b = (student.branch or '').strip().lower()
            if not student_b or student_b not in allowed:
                eligibility_ok = False
                eligibility_notes.append(f'Branch not in allowed list ({drive.eligibility_branch})')
    if drive.eligibility_year and (student.year is None or student.year != drive.eligibility_year):
        eligibility_ok = False
        eligibility_notes.append(f'Year requirement not met (Target: Year {drive.eligibility_year})')

    return {
        'score': score,
        'matched_skills': matched,
        'missing_skills': missing,
        'eligible': eligibility_ok,
        'eligibility_notes': eligibility_notes,
        'recommendation': grade(score, eligibility_ok)
    }


def extract_keywords(text):
    common_tech = [
        'python', 'java', 'javascript', 'sql', 'flask', 'django', 'react', 'vue',
        'node', 'git', 'docker', 'linux', 'aws', 'machine learning', 'deep learning',
        'data analysis', 'excel', 'c++', 'c#', 'rest api', 'html', 'css', 'mongodb',
        'postgresql', 'redis', 'celery', 'pandas', 'numpy', 'scikit'
    ]
    found = []
    for kw in common_tech:
        if kw in text:
            found.append(kw)
    return found


def grade(score, eligible):
    if not eligible:
        return 'not eligible'
    if score >= 80:
        return 'strong match'
    if score >= 50:
        return 'partial match'
    if score >= 20:
        return 'weak match'
    return 'no skill overlap'
