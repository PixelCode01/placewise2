from ats import extract_keywords, run_ats_check, grade

class MockStudent:
    def __init__(self, skills, cgpa=8.5, branch='CSE', year=4):
        self.skills = skills
        self.cgpa = cgpa
        self.branch = branch
        self.year = year

class MockDrive:
    def __init__(self, job_description, eligibility_cgpa=7.0, eligibility_branch='CSE,ECE', eligibility_year=4):
        self.job_description = job_description
        self.eligibility_cgpa = eligibility_cgpa
        self.eligibility_branch = eligibility_branch
        self.eligibility_year = eligibility_year

def test_extract_keywords():
    text = "We are seeking a Python developer proficient with SQL, Docker, and Flask APIs."
    keywords = extract_keywords(text.lower())
    assert 'python' in keywords
    assert 'sql' in keywords
    assert 'docker' in keywords
    assert 'flask' in keywords

def test_ats_check_matching():
    student = MockStudent(skills="Python, Flask, SQL, Git")
    drive = MockDrive(job_description="Requires Python, SQL, and Docker experience.")
    
    result = run_ats_check(student, drive)
    assert result['score'] > 0
    assert 'python' in result['matched_skills']
    assert 'sql' in result['matched_skills']
    assert 'docker' in result['missing_skills']
    assert result['eligible'] is True

def test_ats_grade_levels():
    assert grade(85, True) == 'strong match'
    assert grade(60, True) == 'partial match'
    assert grade(10, True) == 'no skill overlap'
    assert grade(90, False) == 'not eligible'
