import { useState } from "react"

export default function TaskModal({ id, title, description }) {
  return (
    <dialog id={id} className="modal">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="mb-4">{description}</p>

        {/* Comment Section */}
        <div className="max-h-60 overflow-y-auto mb-4 flex flex-col gap-2 pr-2">
          {/* Render comments here */}
        </div>

        <form method="dialog" className="modal-action">
          <button className="btn btn-neutral">Close</button>
        </form>
      </div>
    </dialog>
  );
}