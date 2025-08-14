import Button from "./Button"

interface CalendarSubscribeButtonProps {
  children: string
  color?: string
  disabled?: boolean
}

const CalendarSubscribeButton = (props: CalendarSubscribeButtonProps) => {
    function subscribeToCalendar() {
        console.log('Subscribed')
    }

    return (
      <Button {...props} action={subscribeToCalendar} color={props.color ?? "bg-cyan-400"} />
    )
}

export default CalendarSubscribeButton