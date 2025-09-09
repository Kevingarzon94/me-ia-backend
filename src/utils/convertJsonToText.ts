import resume from '../../data/RESUME.json'
import faqs from '../../data/FAQS.json'
import {Chunk} from "../types/Chunk";

export const convertJsonToText = () => {
    const chunks: Chunk[] = [
        {
            text: `${resume.basics.name} is a ${resume.basics.summary} from ${resume.basics.location}. Currently 
            available for ${resume.basics.availability}, work in ${resume.basics.preferred_mode}`,
            metadata: {
                type: "personal",
                section: "basics"
            }
        },
        {
            text: `I hold ${resume.education.studyType} in ${resume.education.area} from ${resume.education.institution}`,
            metadata: {
                type: "personal",
                section: "education"
            }
        },
        ...resume.work.map((text) => ({
            text: `${text.position} at ${text.company_name} from ${text.start_date} to ${text.end_date}. 
            ${text.summary} Key achievements: ${text.achievements.join('. ')} technologies used: 
            ${text.technology.join('. ')}`,
            metadata: {
                type: "experience",
                company: text.company_name,
                position: text.position
            }
        })),
        {
            text: `Technical skills include expert level in ${resume.skills.languages.expert.join('. ')}, 
            advanced in ${resume.skills.languages.advanced.join('. ')}, 
            intermediate in ${resume.skills.languages.intermediate.join('. ')}, basic in 
            ${resume.skills.languages.basic.join('. ')}, Frontend expertise with 
            ${resume.skills.frontend.frameworks}, styling with: ${resume.skills.frontend.styling.join('. ')}, 
            state management with: ${resume.skills.frontend.state_management}, testing: ${resume.skills.frontend.testing}
            tools like: ${resume.skills.frontend.tools}`,
            metadata: {
                type: "skills",
                subtype: "frontend",
                section: "technical"
            }
        },
        {
            text: `Backend expertise with ${resume.skills.backend.frameworks}, database management with
            ${resume.skills.backend.databases}, apis with ${resume.skills.backend.apis}`,
            metadata: {
                type: "skills",
                subtype: "backend",
                section: "technical"
            }
        },
        {
            text: `devops expertise with ${resume.skills.devops.cloud}, deployments: ${resume.skills.devops.ci_cd}, 
            versioning: ${resume.skills.devops.version_control}`,
            metadata: {
                type: "skills",
                subtype: "devops",
                section: "technical"
            }
        },
        ...faqs.faqs.flatMap(category =>
            category.questions.map(q => ({
                text: `Question: ${q.question} Answer: ${q.answer}`,
                metadata: {
                    type: "faq",
                    category: category.category
                }
            })))

    ]
    return chunks
}