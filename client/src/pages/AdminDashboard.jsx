import useTasks from "../hooks/useTasks";
import TaskRow from "../components/TaskRow";
import { useState } from "react";
import AddTaskModal from "../components/AddTaskModal";
import { openModalById } from "../utils/openModalById";

export default function AdminDashboard() {
  const { tasks, loading, setTasks } = useTasks();

  if (loading) return <p>Loading...</p>;

  return (
    <div className="overflow-x-auto">
      <button
        onClick={() => openModalById("add_task_modal")}
        className="btn btn-success mb-4"
      >
        Add Task
      </button>
      <AddTaskModal setTasks={setTasks} />

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
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} setTasks={setTasks} isAdmin />
          ))}
        </tbody>
      </table>
    </div>
  );
}
