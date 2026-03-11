# Teacher-Student Mentoring System

A comprehensive web-based application to manage mentoring records and facilitate effective teacher-student interactions.

## Features

### 🔐 User Authentication
- **Multi-role support**: Admin, Mentor, and Student registration/login
- **Secure authentication** with role-based access control
- **Persistent sessions** using localStorage

### 👨‍💼 Admin Dashboard
- **User Management**: View all users, manage roles
- **Mentor Assignment**: Assign mentors to students
- **Deadline Management**: Set and manage submission deadlines
- **Form Overview**: View all submitted mentor forms
- **Statistics**: Real-time statistics dashboard

### 👨‍🏫 Mentor Dashboard
- **Student Management**: View assigned students
- **Form Tracking**: Monitor form submission status
- **Notifications**: Real-time alerts for new submissions
- **Student Details**: Comprehensive student information view

### 👨‍🎓 Student Dashboard
- **Mentor Information**: View assigned mentor details
- **Form Submission**: Submit mentor forms with:
  - IA Marks (out of 50)
  - Semester Marks (out of 100)
  - Activities participated (Sports, Cultural, Technical, etc.)
  - Additional comments
- **Deadline Tracking**: View current deadlines and reminders
- **Status Updates**: Track submission status

### 📊 Key Features
- **Attractive UI**: Modern, responsive design with gradients and animations
- **User-Friendly**: Intuitive navigation and easy-to-use interface
- **Real-time Updates**: Instant notifications and status updates
- **Data Persistence**: LocalStorage-based database for demo purposes
- **Mobile Responsive**: Works seamlessly on all devices

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **Database**: LocalStorage (for demo purposes)
- **Styling**: Custom CSS with gradients and animations

## Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software required

### Installation
1. Clone or download the project files
2. Open `index.html` in your web browser
3. The application is ready to use!

### Default Admin Account
- **Email**: admin@mentor.com
- **Password**: admin123
- **Role**: Admin

## Usage Guide

### 1. Admin Setup
1. Login with default admin credentials
2. Register mentors and students
3. Assign mentors to students
4. Set submission deadlines

### 2. Mentor Workflow
1. Login as a mentor
2. View assigned students
3. Monitor form submissions
4. Receive notifications for new forms

### 3. Student Workflow
1. Login as a student
2. View assigned mentor information
3. Complete and submit mentor form before deadline
4. Track submission status

## Project Structure

```
Mentor_System/
├── index.html          # Main application file
├── styles.css          # Custom styling and animations
├── app.js             # JavaScript application logic
├── README.md          # Project documentation
```

## Database Schema

### Users Collection
```javascript
{
  id: string,
  name: string,
  email: string,
  password: string,
  role: string, // 'admin', 'mentor', 'student'
  createdAt: string,
  // Role-specific fields
  department?: string,
  employeeId?: string, // for mentors
  studentId?: string,  // for students
  semester?: number,   // for students
  mentorId?: string    // for students
}
```

### Mentor Forms Collection
```javascript
{
  id: string,
  studentId: string,
  studentName: string,
  mentorId: string,
  iaMarks: number,
  semMarks: number,
  activities: array,
  comments: string,
  submittedAt: string
}
```

### Mentor Assignments Collection
```javascript
{
  id: string,
  studentId: string,
  mentorId: string,
  assignedAt: string,
  assignedBy: string
}
```

### Deadlines Collection
```javascript
{
  id: string,
  deadline: string,
  description: string,
  setBy: string,
  setAt: string
}
```

## Features in Detail

### Registration System
- **Dynamic Forms**: Fields change based on selected role
- **Validation**: Email format, password matching, required fields
- **Role-specific Data**: Additional fields for mentors and students

### Dashboard Analytics
- **Real-time Statistics**: User counts, form submissions, pending items
- **Visual Indicators**: Color-coded status badges and progress indicators
- **Interactive Cards**: Hover effects and smooth transitions

### Form Management
- **Comprehensive Data**: IA marks, semester marks, activities tracking
- **Activity Selection**: Multiple activity categories with checkboxes
- **Comments Section**: Additional context and feedback
- **Timestamp Tracking**: Automatic submission time recording

### Notification System
- **Deadline Alerts**: Automatic deadline reminders
- **Submission Notifications**: Mentors notified of new forms
- **Visual Feedback**: Toast notifications for all actions

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Future Enhancements

- **Backend Integration**: Connect to MySQL/PostgreSQL database
- **Email Notifications**: Real email alerts for deadlines and submissions
- **File Upload**: Attach documents to mentor forms
- **Advanced Analytics**: Charts and graphs for performance tracking
- **Mobile App**: Native mobile application
- **API Integration**: RESTful API for third-party integrations

## Security Notes

This demo version uses localStorage for data persistence and simple password authentication. For production use:

- Implement server-side authentication
- Use secure password hashing
- Connect to a proper database
- Add input validation and sanitization
- Implement CSRF protection
- Use HTTPS for all communications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For questions, issues, or feature requests, please create an issue in the project repository.

---

**Note**: This is a demonstration project using localStorage for data persistence. In a production environment, you would want to implement a proper backend with a database like MySQL, PostgreSQL, or MongoDB.
