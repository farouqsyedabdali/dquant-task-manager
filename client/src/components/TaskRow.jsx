import { openModalById } from "../utils/openModalById";
import TaskModal from "./TaskModal";

export default function TaskRow({ task, setTasks, isAdmin }) {
  const modalId = `task-modal-${task.id}`;

  const handleDelete = async () => {
    const res = await fetch(`http://localhost:5000/tasks/${task.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    }
  };

  return (
    <>
      <tr>
        <td>
          <div className="flex items-center gap-3">
            <div>
              <div className="font-bold">{task.title}</div>
            </div>
          </div>
        </td>
        <td>{task.status}</td>
        <td>
          <span className="badge badge-ghost badge-sm capitalize">
            {task.priority}
          </span>
        </td>
        <td>{task.assignedTo ? task.assignedTo.name : "Unassigned"}</td>
        <td>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => openModalById(modalId)}
          >
            Comments
          </button>
          {isAdmin && (
            <button
              className="btn btn-ghost btn-xs text-red-500"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </td>
      </tr>

      {/* TaskModal Component */}
      <TaskModal
        id={modalId}
        title={task.title}
        description={task.description}
      />
    </>
  );
}
