def test_ping_route(client):
    """Test that the ping route returns a 200 OK status."""
    response = client.get('/api/auth/ping')
    
    assert response.status_code == 200
    assert response.json['status'] == 'auth route working'

def test_student_registration_and_login(client):
    """Test full flow: registering a student and then logging in to get a JWT."""
    
    # 1. Register a student
    register_data = {
        "email": "teststudent@ppa.com",
        "password": "password123",
        "full_name": "Test Student",
        "branch": "CSE"
    }
    
    response = client.post('/api/auth/register/student', json=register_data)
    assert response.status_code == 201
    assert response.json['message'] == 'registration successful'
    
    # 2. Try logging in with the newly created student
    login_data = {
        "email": "teststudent@ppa.com",
        "password": "password123"
    }
    
    login_response = client.post('/api/auth/login', json=login_data)
    assert login_response.status_code == 200
    
    # 3. Verify we received a JWT token!
    assert 'access_token' in login_response.json
