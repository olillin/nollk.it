interface CalendarSubscribeModalProps {
    onClose: () => void
    url: string
}

const CalendarSubscribeModal = (props: CalendarSubscribeModalProps) => {

    return (
        <div className="min-w-xl min-h-lg bg-black border-white border-[1px] border-solid absolute left-50% top-50% z-1000 px-6 py-4 rounded-lg shadow-lg">
            <div className="mb-4 relative mr-4">
                <h2 className="text-2xl inline">Lägg till i kalender</h2>

                <button
                    className="btn ml-2 absolute l-0 t-0"
                    onClick={e => {
                        e.preventDefault()
                        props.onClose()
                    }}
                >
                    X
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <CalendarLink href={`https://www.google.com/calendar/render?cid=${props.url}`}>
                    Till Google Kalender
                </CalendarLink>
                <CalendarLink href={props.url}>
                    Till Apple Kalender
                </CalendarLink>
                <CalendarLink href={`https://outlook.office.com/owa/?path=/calendar/action/compose&rru=addsubscription&url=${props.url}`}>
                    Till Outlook
                </CalendarLink>
            </div>
        </div>
    )
}

export default CalendarSubscribeModal


interface CalendarLinkProps {
    href: string
    children: string
}

const CalendarLink = (props: CalendarLinkProps) => {
    return <a
        className="text-red"
        href={props.href}
        target="_blank"
        >
        {props.children}
    </a>
}
