import resume from '../../data/RESUME.json'
import faqs from '../../data/FAQS.json'
import { Chunk } from "../types/Chunk";

export const convertJsonToText = (): Chunk[] => {
    const chunks: Chunk[] = [];

    chunks.push({
        text: `${resume.basics.name} is a ${resume.basics.label} with ${resume.basics.years_of_experience} years of experience at ${resume.basics.career_level} level. ${resume.basics.summary} Located in ${resume.basics.location.city}, ${resume.basics.location.country}. Currently available: ${resume.basics.availability}. Preferred work mode: ${resume.basics.preferred_mode}.`,
        metadata: {
            type: "personal",
            section: "basics",
            id: "basics_profile"
        }
    });

    chunks.push({
        text: `Contact information for ${resume.basics.name}: Email: ${resume.basics.email}, Phone: ${resume.basics.phone}, Portfolio: ${resume.basics.url}, LinkedIn: ${resume.basics.profiles.linkedin}, GitHub: ${resume.basics.profiles.github}`,
        metadata: {
            type: "personal",
            section: "contact",
            id: "basics_contact"
        }
    });

    chunks.push({
        text: `Education: ${resume.education.studyType} in ${resume.education.area} from ${resume.education.institution} (${resume.education.startDate} - ${resume.education.endDate}, ${resume.education.duration_years} years). Location: ${resume.education.location}. Relevant courses: ${resume.education.courses.join(', ')}. ${resume.education.relevant_projects ? 'Relevant projects: ' + resume.education.relevant_projects.join('; ') : ''}`,
        metadata: {
            type: "personal",
            section: "education",
            institution: resume.education.institution,
            degree: resume.education.studyType,
            id: "education_main"
        }
    });


    resume.work.forEach((job, jobIndex) => {
        chunks.push({
            text: `Work Experience: ${job.position} at ${job.company_name} (${job.start_date} to ${job.end_date}, ${job.duration_months} months). Industry: ${job.industry}. Employment type: ${job.employment_type}. Location: ${job.location}. Summary: ${job.summary}`,
            metadata: {
                type: "experience",
                section: "work",
                company: job.company_name,
                position: job.position,
                duration_months: job.duration_months,
                industry: job.industry,
                id: `work_${jobIndex}_main`
            }
        });

        job.achievements.forEach((achievement, achIndex) => {
            chunks.push({
                text: `Achievement at ${job.company_name}: ${achievement.title}. ${achievement.description}. Impact: ${achievement.impact}. ${achievement.technologies?.length ? `Technologies used: ${achievement.technologies.join(', ')}.` : ` `} Skills demonstrated: ${achievement.skills_demonstrated.join(', ')}.${achievement.metrics ? ` Metrics: Improved ${achievement.metrics.measure} by ${achievement.metrics.improvement_percentage}% (${achievement.metrics.type}).` : ''}`,
                metadata: {
                    type: "achievement",
                    section: "work",
                    company: job.company_name,
                    position: job.position,
                    achievement_id: achievement.id,
                    technologies: achievement.technologies ?? [],
                    skills: achievement.skills_demonstrated,
                    id: `work_${jobIndex}_ach_${achIndex}`
                }
            });
        });

        chunks.push({
            text: `Technologies used at ${job.company_name} as ${job.position}: ${job.technology.join(', ')}.`,
            metadata: {
                type: "technologies",
                section: "work",
                company: job.company_name,
                position: job.position,
                technologies: job.technology,
                id: `work_${jobIndex}_tech`
            }
        });

        job.key_projects.forEach((project, projIndex) => {
            chunks.push({
                text: `Project: ${project.name} at ${job.company_name}. Role: ${project.role}. Description: ${project.description}. Impact: ${project.impact}. Technologies: ${project.technologies.join(', ')}. Challenges: ${project.challenges.join('; ')}. Outcomes: ${project.outcomes.join('; ')}.`,
                metadata: {
                    type: "project",
                    section: "work",
                    company: job.company_name,
                    project_name: project.name,
                    role: project.role,
                    technologies: project.technologies,
                    id: `work_${jobIndex}_proj_${projIndex}`
                }
            });
        });

        if (job.responsibilities && job.responsibilities.length > 0) {
            chunks.push({
                text: `Responsibilities at ${job.company_name} as ${job.position}: ${job.responsibilities.join('; ')}.`,
                metadata: {
                    type: "responsibilities",
                    section: "work",
                    company: job.company_name,
                    position: job.position,
                    id: `work_${jobIndex}_resp`
                }
            });
        }

        if (job.team_leadership) {
            chunks.push({
                text: `Team Leadership at ${job.company_name}: Role as ${job.team_leadership.role} managing ${job.team_leadership.team_size} developers. Responsibilities: ${job.team_leadership.responsibilities.join('; ')}.`,
                metadata: {
                    type: "leadership",
                    section: "work",
                    company: job.company_name,
                    team_size: job.team_leadership.team_size,
                    id: `work_${jobIndex}_leadership`
                }
            });
        }
    });

    chunks.push({
        text: `Programming languages expertise: Expert level (${resume.skills.languages.expert.years_of_experience}+ years) in ${resume.skills.languages.expert.list.join(', ')}. Advanced level (${resume.skills.languages.advanced.years_of_experience}+ years) in ${resume.skills.languages.advanced.list.join(', ')}. Intermediate level (${resume.skills.languages.intermediate.years_of_experience}+ years) in ${resume.skills.languages.intermediate.list.join(', ')}. Basic knowledge in ${resume.skills.languages.basic.list.join(', ')}.`,
        metadata: {
            type: "skills",
            subtype: "languages",
            section: "technical",
            expert: resume.skills.languages.expert.list,
            advanced: resume.skills.languages.advanced.list,
            id: "skills_languages"
        }
    });

    resume.skills.frontend.frameworks.forEach((framework, fwIndex) => {
        chunks.push({
            text: `Frontend framework: ${framework.name}. Proficiency: ${framework.proficiency} (${framework.years} years of experience). Specific skills: ${framework.specific_skills.join(', ')}.`,
            metadata: {
                type: "skills",
                subtype: "frontend_framework",
                section: "technical",
                framework: framework.name,
                proficiency: framework.proficiency,
                years: framework.years,
                id: `skills_frontend_fw_${fwIndex}`
            }
        });
    });

    chunks.push({
        text: `Frontend styling libraries and CSS tools: ${resume.skills.frontend.styling.join(', ')}.`,
        metadata: {
            type: "skills",
            subtype: "frontend_styling",
            section: "technical",
            tools: resume.skills.frontend.styling,
            id: "skills_frontend_styling"
        }
    });

    chunks.push({
        text: `State management libraries: ${resume.skills.frontend.state_management.join(', ')}.`,
        metadata: {
            type: "skills",
            subtype: "state_management",
            section: "technical",
            tools: resume.skills.frontend.state_management,
            id: "skills_state_mgmt"
        }
    });

    chunks.push({
        text: `Frontend testing tools: ${resume.skills.frontend.testing.join(', ')}.`,
        metadata: {
            type: "skills",
            subtype: "testing",
            section: "technical",
            tools: resume.skills.frontend.testing,
            id: "skills_frontend_testing"
        }
    });

    chunks.push({
        text: `Frontend development tools: ${resume.skills.frontend.tools.join(', ')}.`,
        metadata: {
            type: "skills",
            subtype: "frontend_tools",
            section: "technical",
            tools: resume.skills.frontend.tools,
            id: "skills_frontend_tools"
        }
    });

    resume.skills.backend.frameworks.forEach((framework, bfIndex) => {
        chunks.push({
            text: `Backend framework: ${framework.name}. Proficiency: ${framework.proficiency} (${framework.years} years of experience). Specific skills: ${framework.specific_skills.join(', ')}.`,
            metadata: {
                type: "skills",
                subtype: "backend_framework",
                section: "technical",
                framework: framework.name,
                proficiency: framework.proficiency,
                years: framework.years,
                id: `skills_backend_fw_${bfIndex}`
            }
        });
    });

    resume.skills.backend.databases.forEach((db, dbIndex) => {
        chunks.push({
            text: `Database: ${db.name} (${db.type}). Proficiency: ${db.proficiency}. Specific skills: ${db.skills.join(', ')}.`,
            metadata: {
                type: "skills",
                subtype: "database",
                section: "technical",
                database: db.name,
                database_type: db.type,
                proficiency: db.proficiency,
                id: `skills_db_${dbIndex}`
            }
        });
    });

    resume.skills.backend.apis.forEach((api, apiIndex) => {
        chunks.push({
            text: `API expertise: ${api.name}. Proficiency: ${api.proficiency}. Experience: ${api.experience}.`,
            metadata: {
                type: "skills",
                subtype: "api",
                section: "technical",
                api_type: api.name,
                proficiency: api.proficiency,
                id: `skills_api_${apiIndex}`
            }
        });
    });

    chunks.push({
        text: `ORM and database tools: ${resume.skills.backend.orm.join(', ')}.`,
        metadata: {
            type: "skills",
            subtype: "orm",
            section: "technical",
            tools: resume.skills.backend.orm,
            id: "skills_orm"
        }
    });

    resume.skills.devops.cloud.forEach((cloud, cloudIndex) => {
        chunks.push({
            text: `Cloud platform: ${cloud.provider}. Proficiency: ${cloud.proficiency} (${cloud.years} years of experience). Services: ${cloud.services.join(', ')}.`,
            metadata: {
                type: "skills",
                subtype: "cloud",
                section: "devops",
                provider: cloud.provider,
                proficiency: cloud.proficiency,
                services: cloud.services,
                id: `skills_cloud_${cloudIndex}`
            }
        });
    });

    resume.skills.devops.ci_cd.forEach((cicd, cicdIndex) => {
        chunks.push({
            text: `CI/CD tool: ${cicd.tool}. Proficiency: ${cicd.proficiency}. Experience: ${cicd.experience}.`,
            metadata: {
                type: "skills",
                subtype: "cicd",
                section: "devops",
                tool: cicd.tool,
                proficiency: cicd.proficiency,
                id: `skills_cicd_${cicdIndex}`
            }
        });
    });

    resume.skills.devops.containers.forEach((container, contIndex) => {
        chunks.push({
            text: `Container technology: ${container.tool}. Proficiency: ${container.proficiency}. Experience: ${container.experience}.`,
            metadata: {
                type: "skills",
                subtype: "containers",
                section: "devops",
                tool: container.tool,
                id: `skills_container_${contIndex}`
            }
        });
    });

    resume.skills.devops.monitoring.forEach((monitor, monIndex) => {
        chunks.push({
            text: `Monitoring tool: ${monitor.tool}. Proficiency: ${monitor.proficiency}. Experience: ${monitor.experience}.`,
            metadata: {
                type: "skills",
                subtype: "monitoring",
                section: "devops",
                tool: monitor.tool,
                id: `skills_monitor_${monIndex}`
            }
        });
    });

    resume.skills.methodologies.forEach((methodology, methIndex) => {
        chunks.push({
            text: `Methodology: ${methodology.name}. Experience: ${methodology.experience}. ${methodology.role ? 'Role: ' + methodology.role + '.' : ''} ${methodology.practices ? 'Practices: ' + methodology.practices.join(', ') + '.' : ''} ${methodology.application ? 'Application: ' + methodology.application + '.' : ''}`,
            metadata: {
                type: "skills",
                subtype: "methodology",
                section: "professional",
                methodology: methodology.name,
                id: `skills_method_${methIndex}`
            }
        });
    });

    resume.skills.soft_skills.forEach((softSkill, ssIndex) => {
        chunks.push({
            text: `Soft skill: ${softSkill.skill}. Level: ${softSkill.level}. Experience: ${softSkill.experience}.`,
            metadata: {
                type: "skills",
                subtype: "soft_skill",
                section: "professional",
                skill: softSkill.skill,
                level: softSkill.level,
                id: `skills_soft_${ssIndex}`
            }
        });
    });


    resume.languages.forEach((lang, langIndex) => {
        chunks.push({
            text: `Language: ${lang.language}. Level: ${lang.level} (${lang.proficiency}). Spoken: ${lang.spoken}, Written: ${lang.written}, Reading: ${lang.reading}. ${lang.note ? 'Note: ' + lang.note : ''} ${lang.improving ? 'Currently improving through: ' + lang.learning_methods.join(', ') + '.' : ''}`,
            metadata: {
                type: "language",
                section: "personal",
                language: lang.language,
                level: lang.level,
                proficiency: lang.proficiency,
                id: `language_${langIndex}`
            }
        });
    });

    resume.professional_interests.forEach((interest, intIndex) => {
        chunks.push({
            text: `Professional interest: ${interest.interest}. Level: ${interest.level}. Activities: ${interest.activities.join(', ')}.`,
            metadata: {
                type: "interest",
                section: "professional",
                interest_area: interest.interest,
                level: interest.level,
                id: `interest_${intIndex}`
            }
        });
    });

    resume.ideal_company_values.forEach((value, valIndex) => {
        chunks.push({
            text: `Ideal company value: ${value.value}. Importance: ${value.importance}. Description: ${value.description}.`,
            metadata: {
                type: "preference",
                section: "career",
                value: value.value,
                importance: value.importance,
                id: `value_${valIndex}`
            }
        });
    });

    resume.portfolio_highlights.forEach((highlight, hlIndex) => {
        chunks.push({
            text: `Portfolio highlight: ${highlight.title}. ${highlight.description}. Impact: ${highlight.impact}.`,
            metadata: {
                type: "highlight",
                section: "portfolio",
                title: highlight.title,
                id: `highlight_${hlIndex}`
            }
        });
    });

    faqs.faqs.forEach((category) => {
        category.questions.forEach((question, qIndex) => {
            // Chunk principal con la pregunta y respuesta
            chunks.push({
                text: `Question: ${question.question}\nAnswer: ${question.answer}${question.related_context ? '\nAdditional context: ' + question.related_context : ''}`,
                metadata: {
                    type: "faq",
                    section: "qa",
                    category: category.category,
                    question_id: question.id,
                    keywords: question.keywords,
                    id: `faq_${category.category}_${qIndex}`
                }
            });

            if (question.question_variations && question.question_variations.length > 0) {
                chunks.push({
                    text: `Alternative questions for "${question.question}": ${question.question_variations.join('; ')}. Answer: ${question.answer}`,
                    metadata: {
                        type: "faq_variation",
                        section: "qa",
                        category: category.category,
                        question_id: question.id,
                        original_question: question.question,
                        keywords: question.keywords,
                        id: `faq_var_${category.category}_${qIndex}`
                    }
                });
            }
        });
    });

    console.log(`Generated ${chunks.length} chunks from resume and FAQs`);
    return chunks;
}