import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";


export default function useRedirect() {
    const { data: session, status} = useSession();
    const router = useRouter();

    const goToDashboard = () => {
        router.push("/dashboard");
    }

    return {
        session,
        status,
        goToDashboard,
    }
}