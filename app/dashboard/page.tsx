
"use client"
import { useSession } from 'next-auth/react'
import StreamView from '@/app/components/StreamView'
import useRedirect from '../hooks/useRedirect';
import { useRouter } from 'next/navigation';


export default function Component() {
    const session = useSession();
    const redirect = useRedirect;
    const router = useRouter();

    if (session.status === "loading") {
        return <div>Loading...</div>;
    }
    if (!session.data?.user.id) {
        router.push("/");
        return <h1>Please Log in....</h1>;
    }

    return <StreamView creatorId={session.data.user.id} playVideo={true} />;
}

export const dynamic = 'auto'