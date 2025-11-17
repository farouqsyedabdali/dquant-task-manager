// Load environment variables first
require('dotenv').config();

const emailService = require('./src/services/emailService');

// Test with your email
emailService.sendTaskReminder({
  recipientEmail: 'navedabdali@gmail.com', // ← Change this
  userName: 'Baba',
  task: {
    title: 'Hi Baba, please let me know if you can see this email',
    description: 'This is a test of the reminder system',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    assignee: { name: 'Admin User' }
  },
  taskId: 62 // Use any existing task ID
}).then(result => {
  console.log('✅ Test email sent!', result);
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});