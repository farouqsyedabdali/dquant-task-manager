import { useState } from 'react';
import { FaTimes, FaBook, FaUser, FaTasks, FaProjectDiagram, FaUsers, FaCog, FaRocket, FaQuestionCircle } from 'react-icons/fa';

const UserManualModal = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('getting-started');

  if (!isOpen) return null;

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: <FaUser /> },
    { id: 'tasks', label: 'Tasks', icon: <FaTasks /> },
    { id: 'projects', label: 'Projects', icon: <FaProjectDiagram /> },
    { id: 'collaboration', label: 'Collaboration', icon: <FaUsers /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> },
    { id: 'advanced', label: 'Advanced Features', icon: <FaRocket /> },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: <FaQuestionCircle /> },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Welcome to Tialz Task Manager!
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Tialz is a modern, Jira-like task management system designed to help you organize your work,
                collaborate with your team, and stay productive. Whether you're managing personal tasks or
                coordinating a team, Tialz makes it easy to create, assign, and track tasks from start to finish.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🚀 Quick Start Guide
              </h4>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>1. Choose Your Account Type</h5>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    When you first sign up, you'll choose between a <strong>Personal Account</strong> (for individual use)
                    or a <strong>Company Account</strong> (for team collaboration).
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h5 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>2. Explore the Dashboard</h5>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Your dashboard shows all your tasks at a glance. Use the sidebar to navigate between different views
                    like Dashboard, Calendar, Tasks, and Projects.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h5 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>3. Create Your First Task</h5>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Click the "Create Task" button to add your first task. Fill in the title, description, priority,
                    and due date. Don't worry - you can always edit these later!
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🎯 Key Concepts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>📋 Tasks</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Individual work items with titles, descriptions, priorities, and due dates.
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>📁 Projects</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Collections of related tasks organized around a common goal or objective.
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>👥 Teams</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Groups of people working together on tasks and projects (company accounts only).
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>💬 Comments</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Conversations and updates attached to specific tasks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Creating and Managing Tasks
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Tasks are the core of Tialz. Learn how to create, edit, assign, and track your work items.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                📝 Creating Tasks
              </h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Manual Creation</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Click "Create Task" button in the top navigation or dashboard</li>
                    <li>Fill in the task title (required)</li>
                    <li>Add a description (optional but recommended)</li>
                    <li>Set priority: Low, Medium, High, or Urgent</li>
                    <li>Choose a due date and time</li>
                    <li>Assign to yourself or a team member</li>
                    <li>Click "Create Task"</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>AI-Powered Creation</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Copy text describing your task (from email, chat, etc.)</li>
                    <li>Click the "Quick Actions" dropdown in the header</li>
                    <li>Select "Create Task"</li>
                    <li>AI will automatically extract task details</li>
                    <li>Review and adjust if needed, then save</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                📊 Task Status & Priority
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Status Options</h5>
                  <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li><span className="text-orange-400">🔄 To Do:</span> Task is planned but not started</li>
                    <li><span className="text-blue-400">▶️ In Progress:</span> Currently working on it</li>
                    <li><span className="text-green-400">✅ Completed:</span> Task is finished</li>
                    <li><span className="text-gray-400">⏸️ On Hold:</span> Temporarily paused</li>
                    <li><span className="text-red-400">❌ Cancelled:</span> Task won't be completed</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Priority Levels</h5>
                  <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li><span className="text-gray-400">⬇️ Low:</span> Nice to have, no rush</li>
                    <li><span className="text-yellow-400">➡️ Medium:</span> Should be done soon</li>
                    <li><span className="text-orange-400">⬆️ High:</span> Important, get it done</li>
                    <li><span className="text-red-400">🚨 Urgent:</span> Critical, do it now!</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                💬 Adding Comments
              </h4>
              <p className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Comments help keep everyone updated on task progress and decisions.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <li>Open any task by clicking on it</li>
                <li>Scroll down to the "Comments" section</li>
                <li>Type your message in the text box</li>
                <li>Click "Post Comment" or press Enter</li>
                <li>All task participants will see your comment</li>
              </ol>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Working with Projects
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Projects help you organize related tasks into meaningful groups. Think of them as folders for your work.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                📁 Creating Projects
              </h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>From Scratch</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Go to the "Projects" page from the sidebar</li>
                    <li>Click "Create Project"</li>
                    <li>Give your project a clear, descriptive name</li>
                    <li>Add a description explaining the project's goal</li>
                    <li>Set a due date for the entire project</li>
                    <li>Choose a color and icon to make it easily recognizable</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>From AI Templates</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Copy text describing your project idea</li>
                    <li>Click "Quick Actions" in the header</li>
                    <li>Select "Create Project from Idea"</li>
                    <li>AI will generate a complete project with tasks</li>
                    <li>Review and customize as needed</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🏗️ Project Structure
              </h4>
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Parent Tasks</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Main objectives or milestones within your project. These are the big-picture items.
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Subtasks</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Smaller, actionable steps that contribute to completing a parent task.
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Draft Tasks</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Tasks that are planned but not yet ready to be worked on. Great for project planning.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                👥 Managing Team Members
              </h4>
              <p className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Add team members to collaborate on projects (available for company accounts).
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <li>Open a project</li>
                <li>Go to the "Team & Sharing" tab</li>
                <li>Click "Add Member"</li>
                <li>Choose a role: Owner, Member, or Viewer</li>
                <li>Team members can now see and work on project tasks</li>
              </ol>
            </div>
          </div>
        );

      case 'collaboration':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Collaborating with Others
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Tialz makes it easy to work with team members, external contacts, and even people outside your organization.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                👥 Team Collaboration (Company Accounts)
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Adding Team Members</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Go to Settings → Account</li>
                    <li>Scroll to "Employee Management"</li>
                    <li>Click "Add Employee"</li>
                    <li>Fill in their details and assign a role</li>
                    <li>They'll receive an invitation email</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Assigning Tasks</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    When creating or editing a task, simply select a team member from the "Assigned To" dropdown.
                    They'll receive notifications and can update task status and add comments.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                📧 External Collaboration
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Inviting External Contacts</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Open any task</li>
                    <li>Click the "Email" button</li>
                    <li>Enter the person's email address</li>
                    <li>Add a personal message</li>
                    <li>They'll receive an email invitation to collaborate</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>How External Collaboration Works</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>External contacts can view and comment on assigned tasks</li>
                    <li>They can update task status (To Do ↔ In Progress ↔ Completed)</li>
                    <li>They receive email notifications for updates</li>
                    <li>No account creation required - they collaborate through email</li>
                    <li>Perfect for clients, contractors, or cross-company collaboration</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                💬 Communication Best Practices
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>✅ Do's</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Use comments to provide context</li>
                    <li>• Tag team members in comments</li>
                    <li>• Update task status regularly</li>
                    <li>• Celebrate completed work</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>❌ Don'ts</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Leave tasks in "To Do" indefinitely</li>
                    <li>• Forget to communicate blockers</li>
                    <li>• Update due dates without explanation</li>
                    <li>• Ignore team member comments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Customizing Your Experience
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Make Tialz work the way you want it to. Customize themes, preferences, and account settings.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🎨 Themes & Appearance
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Color Themes</h5>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Choose from light and dark themes to match your preference and work environment.
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Go to Settings → Preferences → Color Theme</li>
                    <li>Browse through available palettes</li>
                    <li>Click any theme to apply it instantly</li>
                    <li>Your choice is saved automatically</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Font Size</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Adjust text size for better readability. Changes apply across the entire application.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                ⏰ Task Management Preferences
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Auto-Archive Settings</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Automatically archive completed tasks that are past their due date to keep your dashboard clean.
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Choose from 3, 6, or 12 months</li>
                    <li>Tasks older than the selected period get archived</li>
                    <li>Archived tasks can still be viewed in the archive</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                👤 Account Management
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                  <h5 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">⚠️ Important</h5>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Account deletion is permanent and cannot be undone. Make sure to export any important data before deleting.
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>For Personal Accounts</h5>
                  <ul className="list-disc list-inside text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Go to Settings → Account</li>
                    <li>Scroll to "Account Management"</li>
                    <li>Click "Delete Account"</li>
                    <li>Type your email address to confirm</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>For Company Accounts (Admins Only)</h5>
                  <ul className="list-disc list-inside text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Go to Settings → Account</li>
                    <li>Scroll to "Company Management"</li>
                    <li>Click "Delete Company"</li>
                    <li>Type "DELETE" to confirm</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                💬 Feedback & Support
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                We love hearing from you! Use the feedback form in Settings to share suggestions,
                report issues, or just say hello. Every message is read and helps us improve Tialz.
              </p>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Advanced Features & Tools
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Unlock the full power of Tialz with these advanced features designed for power users.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🤖 AI-Powered Features
              </h4>
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>💬 AI Chat Assistant</h5>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Have a conversation with AI to create, update, or manage your tasks naturally.
                  </p>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• "Create a task to review the marketing report by Friday"</li>
                    <li>• "Show me all my urgent tasks"</li>
                    <li>• "Mark the website update as completed"</li>
                    <li>• Access via the chat icon in the sidebar</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>⚡ Quick Actions</h5>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Instantly create tasks and projects from any text using AI.
                  </p>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Copy text from emails, chats, or documents</li>
                    <li>• Click "Quick Actions" in the header</li>
                    <li>• Choose "Create Task" or "Create Project"</li>
                    <li>• AI extracts and organizes the information automatically</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🖥️ Multiple Platforms
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>🌐 Web App</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Full-featured web application accessible from any browser.
                  </p>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>💻 Desktop App</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Native desktop application with auto-updates. Download from Settings → About.
                  </p>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>🔌 Browser Extension</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Capture tasks directly from web pages. Available on Chrome Web Store.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                📊 Advanced Filtering & Views
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Task Filtering</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Use multiple filters simultaneously to find exactly what you need.
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Filter by status, priority, assignee, project, and due date</li>
                    <li>Combine filters for precise task lists</li>
                    <li>Save filter combinations for quick access</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Calendar View</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Visualize your tasks and deadlines in a beautiful calendar interface.
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Monthly, weekly, and daily views</li>
                    <li>Color-coded by priority and status</li>
                    <li>Drag and drop to reschedule tasks</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                📈 Audit Logs (Admin Only)
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Track all user actions and system changes for compliance and troubleshooting.
              </p>
              <ul className="list-disc list-inside text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li>View detailed logs of all user activities</li>
                <li>Filter by user, action type, or date range</li>
                <li>Export logs for external auditing</li>
                <li>Access via Settings → Account → Admin Tools</li>
              </ul>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Troubleshooting Common Issues
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Having trouble? Check these common solutions before contacting support.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🔐 Login & Account Issues
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Can't log in?</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Check your email and password are correct</li>
                    <li>• Try resetting your password</li>
                    <li>• Clear your browser cache and cookies</li>
                    <li>• Try a different browser or incognito mode</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Forgot password?</h5>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Use the "Forgot Password" link on the login page. Check your email for reset instructions.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                📱 Performance & Display Issues
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>App running slow?</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Refresh the page (Ctrl+F5 or Cmd+Shift+R)</li>
                    <li>• Clear browser cache and reload</li>
                    <li>• Try a different browser</li>
                    <li>• Check your internet connection</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Display looks wrong?</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Try changing your theme in Settings → Preferences</li>
                    <li>• Adjust font size if text is too small/large</li>
                    <li>• Make sure your browser is up to date</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                📧 Email & Notification Issues
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Not receiving emails?</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Check your spam/junk folder</li>
                    <li>• Add notifications@tialz.com to your contacts</li>
                    <li>• Verify your email address in account settings</li>
                    <li>• Contact support if emails are consistently not arriving</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🔧 Task & Project Issues
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Can't edit a task?</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Make sure you're the task creator or assignee</li>
                    <li>• Check if you have the right permissions</li>
                    <li>• Try refreshing the page</li>
                    <li>• Contact your admin if it's a company account</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Tasks not showing up?</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Check your filters - they might be hiding tasks</li>
                    <li>• Try clearing all filters</li>
                    <li>• Refresh the page</li>
                    <li>• Check if tasks are archived</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                🆘 Still Need Help?
              </h4>
              <div className="p-4 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">📞 Contact Support</h5>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  If none of these solutions work, we're here to help!
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Use the feedback form in Settings → Feedback</li>
                  <li>• Include screenshots if possible</li>
                  <li>• Describe what you were doing when the issue occurred</li>
                  <li>• Mention your browser and device type</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal modal-open backdrop-blur-sm animate-fadeIn">
      <div
        className="modal-box max-w-6xl border max-h-[90vh] transition-colors duration-200"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaBook className="text-2xl" style={{ color: 'var(--color-primary)' }} />
            <h3
              className="text-2xl font-bold transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Tialz User Manual
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div
              className="rounded-lg p-3 sticky top-0"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                borderWidth: 1,
              }}
            >
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                    style={
                      activeSection === section.id
                        ? {
                            backgroundColor: 'var(--color-primary)',
                            color: '#ffffff',
                          }
                        : {
                            color: 'var(--color-text-secondary)',
                            backgroundColor: 'transparent',
                          }
                    }
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 150px)' }}>
            {renderContent()}
          </div>
        </div>

        <div className="modal-action mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <button
            onClick={onClose}
            className="btn btn-primary transition-colors duration-200"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;