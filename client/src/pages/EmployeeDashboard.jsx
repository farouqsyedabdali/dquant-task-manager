import useTasks from '../hooks/useTasks'
import TaskRow from '../components/TaskRow'

export default function AdminDashboard() {
  const { tasks, loading, setTasks } = useTasks()

  if (loading) return <p>Loading...</p>

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assigned To</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} setTasks={setTasks} isAdmin={false} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
