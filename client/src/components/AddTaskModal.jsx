import { useState } from "react"

export default function AddTaskModal({ setTasks }) {
  const [form, setForm] = useState({ title: '', description: '', status: 'incomplete', priority: 'medium', assignedToID: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const newTask = await res.json()
    setTasks(prev => [...prev, newTask])
    document.getElementById('add_task_modal').close()
  }

  return (
    <dialog id="add_task_modal" className="modal">
      <form className="modal-box" onSubmit={handleSubmit}>
        <h3 className="font-bold text-lg">Add Task</h3>
        <input className="input input-bordered w-full my-2" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input className="input input-bordered w-full my-2" placeholder="Name" value={form.assignedToID} onChange={e => setForm({ ...form, assignedToID: e.target.value})} required></input>
        <textarea className="textarea textarea-bordered w-full my-2" data-gramm={false} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
        <select className="select select-bordered w-full my-2" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="btn btn-primary w-full">Add</button>
      </form>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}

