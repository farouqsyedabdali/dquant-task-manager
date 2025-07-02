export function openModalById(id) {
  const modal = document.getElementById(id)
  if (modal) modal.showModal()
}
