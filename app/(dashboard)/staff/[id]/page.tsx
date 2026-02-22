import { use } from "react"
import { StaffProfileClient } from "./staff-profile-client"

/** Unwrap params with React.use() to avoid Next.js 16 params enumeration warning (dev overlay serialization). */
export default function StaffProfilePage(props: { params: Promise<{ id: string }> }) {
    const { id } = use(props.params)
    return <StaffProfileClient staffId={id} />
}
