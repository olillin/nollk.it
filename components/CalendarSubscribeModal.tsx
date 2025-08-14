interface CalendarSubscribeModalProps {
    url: string
}

const CalendarSubscribeModal = (props: CalendarSubscribeModalProps) => {
    return (
        <div>
            <a href={`https://www.google.com/calendar/render?cid=${props.url}`} target="_blank">
                Lägg till i Google Kalender
            </a>
            <a href={props.url} target="_blank">
                Lägg till i Apple Kalender
            </a>
            <a href={`https://outlook.office.com/owa/?path=/calendar/action/compose&rru=addsubscription&url=${props.url}`} target="_blank">
                Lägg till i Outlook
            </a>
        </div>
    )
}
