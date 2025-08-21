interface ModalProps {
    children?: React.ReactNode
    onClose: () => void
    background?: string
}

const Modal = (props: ModalProps) => {
    return (
        <div className="fixed inset-0 z-40 flex justify-center items-center">
            <button
                className="absolute inset-0 bg-black/60"
                onClick={e => {
                    e.preventDefault()
                    props.onClose()
                }}
            />

            <div
                className={
                    'absolute rounded-lg shadow-lg px-8 pt-4 pb-6 border border-white ' +
                    (props.background ?? 'bg-black')
                }
            >
                <div className="flex justify-end">
                    <button
                        className="r-1 t-0 -mr-4 aspect-square"
                        onClick={e => {
                            e.preventDefault()
                            props.onClose()
                        }}
                    >
                        <span className="h-4 p-2 text-xl">&times;</span>
                    </button>
                </div>
                {props.children}
            </div>
        </div>
    )
}

export default Modal
