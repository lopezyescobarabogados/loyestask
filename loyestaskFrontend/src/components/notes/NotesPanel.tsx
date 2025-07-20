import type { Task } from "@/types/index";
import AddNoteForm from "./AddNoteForm";
import NoteDetail from "./NoteDetail";

type NotesPanelProps = {
    notes: Task['notes']
}

export default function NotesPanel({notes} : NotesPanelProps) {
  return (
    <>
        <AddNoteForm />
        <div className="divide-y divide-slate-100 mt-10 ">
            {notes.length ? (
               <>
                  <p className="font-bold text-2xl text-slate-600 my-5">Notas:</p>
                  {notes.map(note => <NoteDetail key={note._id} note={note} />)}
               </>
            ) : <p className="text-slate-700 text-center pt-3">No hay notas disponibles</p>}
        </div>
    </>
  )
}
