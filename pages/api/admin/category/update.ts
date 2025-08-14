import { NextApiRequest, NextApiResponse } from 'next'
import { Category, TimeLineEvent } from '@prisma/client'
import * as jose from 'jose'
import { prisma } from '../../../../prisma/prismaclient'

export default async function update(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { payload } = await jose.jwtVerify(
        req.cookies.token || '',
        new TextEncoder().encode(process.env.PASSWORD)
    )

    if (!payload) {
        res.status(401).json({ message: 'Unauthorized' })
        return
    }

    const categories: Category[] = req.body.categories
    const deletedCategories = await prisma.category.deleteMany({
        where: {
            NOT: {
                title: {
                    in: [...categories].map(category => category.title),
                },
            },
        },
    })
    const updateCategories = await Promise.all(
        categories.map(async category => {
            return await prisma.category.upsert({
                where: {
                    title: category.title,
                },
                update: {
                    color: category.color,
                },
                create: {
                    title: category.title,
                    color: category.color,
                },
            })
        })
    )

    res.json(updateCategories)
}
