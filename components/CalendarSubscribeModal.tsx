import Modal from './Modal'

type CalendarSubscribeModalProps = {
    url: string
    onClose: () => void
    background: string
}

const CalendarSubscribeModal = (props: CalendarSubscribeModalProps) => {
    return (
        <Modal onClose={props.onClose} background={props.background}>
            <h2 className="text-2xl mb-4 pr-8">Lägg till i kalender</h2>

            <div className="flex flex-col gap-4">
                <CalendarLink
                    href={`https://www.google.com/calendar/render?cid=${props.url}`}
                >
                    Google Kalender
                </CalendarLink>
                <CalendarLink href={props.url}>Apple Kalender</CalendarLink>
                <CalendarLink
                    href={`https://outlook.office.com/owa/?path=/calendar/action/compose&rru=addsubscription&url=${props.url}`}
                >
                    Outlook
                </CalendarLink>
            </div>
        </Modal>
    )
}

export default CalendarSubscribeModal

interface CalendarLinkProps {
    href: string
    children?: string
}

const CalendarLink = (props: CalendarLinkProps) => {
    return (
        <a
            className="text-cyan-600 underline"
            href={props.href}
            target="_blank"
        >
            {props.children}
        </a>
    )
}
