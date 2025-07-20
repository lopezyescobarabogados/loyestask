import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div>
        <h1 className="font-black texte-center text-4xl text-white">Página no encontrada</h1>
        <p className="mt-10 text-center text-black">
            Tal vez la URL que estás buscando no existe o ha sido eliminada.
            <Link className="text-slate-500 " to="/">Volver al inicio</Link>
        </p>
    </div>
  )
}
