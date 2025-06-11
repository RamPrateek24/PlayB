import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import { YT_REGEX } from "@/app/lib/utils";
import { getServerSession } from "next-auth";



const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string()
})

const MAX_QUEUE_LEN = 20;

export async function POST(req: NextRequest) {
    try{
       const data = CreateStreamSchema.parse(await req.json());
       const isYt = data.url.match(YT_REGEX)
       if(!isYt) {
            return NextResponse.json({
                 message: "Wrong URL format"
             },{
                 status: 411
             })
       }

       const session = await getServerSession();
       const user =await prismaClient.user.findFirst({
           where: {
                email: session?.user?.email ??"",
           }
       });
   
       if(!user){
           return NextResponse.json({
               message: "Unauthenticated"
           }, {
               status: 403
           })
       }

        const extractedId = data.url.split("?v=")[1];

        const res = await youtubesearchapi.GetVideoDetails(extractedId);
       
        const thumbnails = res.thumbnail.thumbnails;
        thumbnails.sort((a: {width:number}, b: {width:number}) => a.width<b.width ? -1 : 1);

        const existingActiveStream = await prismaClient.stream.count({
            where: {
                userId: data.creatorId,
                played:false
            }
        })
            if(existingActiveStream > MAX_QUEUE_LEN){
                return NextResponse.json({
                    message: "Already at Limit"
        
                },{
                    status: 411
                })

            }
        const stream = await prismaClient.stream.create({
            data: {
                userId: data.creatorId, 
                addedById: user.id,
                url: data.url,
                extractedId: extractedId,
                type: "Youtube",
                title: res.title ?? "Can't find video",
                smallImg: (thumbnails.length > 1 ? thumbnails[thumbnails.length-2].url : thumbnails[thumbnails.length-1]).url ?? "https://www.google.com/imgres?q=ben10%20images&imgurl=https%3A%2F%2Fwallpapers.com%2Fimages%2Fhd%2Fyellow-ben-10-tm48bfzlim9zhxe9.jpg&imgrefurl=https%3A%2F%2Fwallpapers.com%2Fben-10&docid=spf8ksCYhVQKyM&tbnid=Qx1h14pmZTXMmM&vet=12ahUKEwjczJa3prOIAxU87jgGHci0C3wQM3oFCIYBEAA..i&w=1920&h=1080&hcb=2&ved=2ahUKEwjczJa3prOIAxU87jgGHci0C3wQM3oFCIYBEAA" ,
                bigImg: thumbnails[thumbnails.length-1].url ?? "https://www.google.com/imgres?q=ben10%20images&imgurl=https%3A%2F%2Fwallpapers.com%2Fimages%2Fhd%2Fyellow-ben-10-tm48bfzlim9zhxe9.jpg&imgrefurl=https%3A%2F%2Fwallpapers.com%2Fben-10&docid=spf8ksCYhVQKyM&tbnid=Qx1h14pmZTXMmM&vet=12ahUKEwjczJa3prOIAxU87jgGHci0C3wQM3oFCIYBEAA..i&w=1920&h=1080&hcb=2&ved=2ahUKEwjczJa3prOIAxU87jgGHci0C3wQM3oFCIYBEAA" 
            }
        });

        return NextResponse.json({
            ...stream,
            hasUpvoted: false,
            upvotes: 0
        })
} catch(e) {
        console.log(e);
        return NextResponse.json({
            message: "Error while adding a stream"

        },{
            status: 411
        })
    }
}

export async function GET(req: NextRequest){
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    const session = await getServerSession();
    const user =await prismaClient.user.findFirst({
        where: {
            email: session?.user?.email ??""
        }
    });
    

    if(!user){
        return NextResponse.json({
            message: "Unauthenticated"
        }, {
            status: 403
        })
    }

    if(!creatorId){
        return NextResponse.json({
            message: "Error"
        }, {
            status: 411
        })
    }
    const [streams,activeStream] = await Promise.all([await prismaClient.stream.findMany({
        where: {
            userId: creatorId,
            played: false
        },
        include: {
            _count: {
                select: {
                    upvotes: true
                }
            },
            upvotes: {
                where: {
                    userId: user.id
                }
            }
        }
    }), prismaClient.currentStream.findFirst({
        where: {
            userId: creatorId
        },
        include: {
            stream: true
        }
    })])

    const isCreator = user.id === creatorId;

    return NextResponse.json({
        streams: streams.map(({ 
            _count, 
            ...rest 
        }: { 
            _count: { upvotes: number }; 
            upvotes: any[];               
            id: string;                  
            title: string;
           
        }) => ({
            ...rest,
            upvotes: _count.upvotes,
            haveUpvoted: rest.upvotes.length > 0  
        }))
        });
}

