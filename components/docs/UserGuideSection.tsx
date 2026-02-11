import { BookOpen, Users, GraduationCap, ShieldCheck, Sparkles, Settings, FileText, Database, BarChart3, HelpCircle } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function UserGuideSection() {
    return (
        <div className="space-y-32">
            {/* User Roles Section */}
            <section id="user-roles" className="scroll-mt-32 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <Users size={24} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Access Levels</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tight">User Roles & Permissions</h2>
                    <p className="text-zinc-400 leading-relaxed font-medium">
                        The system has three user roles with different permission levels and capabilities.
                    </p>
                </div>

                <div className="grid gap-6">
                    {[
                        {
                            role: 'Student',
                            color: 'zinc',
                            icon: GraduationCap,
                            permissions: [
                                'View assigned papers and study materials',
                                'Access lectures and quizzes',
                                'View personal records and attendance',
                                'Take online assessments'
                            ]
                        },
                        {
                            role: 'Teacher',
                            color: 'blue',
                            icon: BookOpen,
                            permissions: [
                                'All Student permissions',
                                'Generate examination papers with AI',
                                'Mark attendance (requires Principal verification)',
                                'Upload lectures and study materials',
                                'View student records (read-only)'
                            ]
                        },
                        {
                            role: 'Principal',
                            color: 'emerald',
                            icon: ShieldCheck,
                            permissions: [
                                'All Teacher permissions',
                                'Manage users (promote/demote roles)',
                                'Verify teacher attendance',
                                'Manage curriculum and chapters',
                                'Full access to student records (edit/delete)',
                                'View system analytics and AI usage',
                                'Manage financial records'
                            ]
                        }
                    ].map((item, idx) => (
                        <Card key={idx} className={`bg-zinc-900/40 border-${item.color}-500/20 rounded-3xl p-6 hover:border-${item.color}-500/40 transition-all`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-500 shrink-0`}>
                                    <item.icon size={24} />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">{item.role}</h3>
                                        <Badge className={`bg-${item.color}-500/10 text-${item.color}-500 border-none text-[9px] font-black uppercase tracking-widest`}>
                                            {item.role === 'Principal' ? 'Administrator' : item.role === 'Teacher' ? 'Faculty' : 'Learner'}
                                        </Badge>
                                    </div>
                                    <ul className="space-y-2">
                                        {item.permissions.map((perm, i) => (
                                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                                                <div className={`w-1 h-1 rounded-full bg-${item.color}-500 mt-1.5 shrink-0`} />
                                                {perm}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* AI Paper Generation Section */}
            <section id="paper-generation" className="scroll-mt-32 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <Sparkles size={24} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">AI Engine</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tight">AI Paper Generation</h2>
                    <p className="text-zinc-400 leading-relaxed font-medium">
                        Generate customized examination papers automatically using advanced AI with 40+ customization options.
                    </p>
                </div>

                <Accordion className="w-full space-y-4">
                    <AccordionItem value="step-1" className="border-white/5 bg-zinc-900/20 rounded-2xl px-6">
                        <AccordionTrigger className="text-sm font-bold hover:no-underline text-zinc-300">
                            Step 1: Select Basic Configuration
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-500 text-xs leading-relaxed font-medium pb-4 space-y-3">
                            <div className="space-y-2">
                                <p className="text-zinc-400 font-bold">Choose your paper settings:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><span className="text-emerald-500 font-bold">Grade:</span> Select class level (9th, 10th, 11th, 12th)</li>
                                    <li><span className="text-emerald-500 font-bold">Stream:</span> Computer, Medical, or General Science</li>
                                    <li><span className="text-emerald-500 font-bold">Subject:</span> English, Urdu, Math, Biology, Chemistry, Physics, etc.</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step-2" className="border-white/5 bg-zinc-900/20 rounded-2xl px-6">
                        <AccordionTrigger className="text-sm font-bold hover:no-underline text-zinc-300">
                            Step 2: Choose Chapters
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-500 text-xs leading-relaxed font-medium pb-4 space-y-3">
                            <div className="space-y-2">
                                <p className="text-zinc-400 font-bold">Select chapter coverage:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><span className="text-blue-500 font-bold">Single Chapter:</span> For chapter-wise tests</li>
                                    <li><span className="text-blue-500 font-bold">Multiple Chapters:</span> For mid-term or final exams</li>
                                    <li><span className="text-blue-500 font-bold">Manual Entry:</span> Type custom chapter names</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step-3" className="border-white/5 bg-zinc-900/20 rounded-2xl px-6">
                        <AccordionTrigger className="text-sm font-bold hover:no-underline text-zinc-300">
                            Step 3: Configure Questions
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-500 text-xs leading-relaxed font-medium pb-4 space-y-3">
                            <div className="space-y-2">
                                <p className="text-zinc-400 font-bold">Set question counts and types:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><span className="text-emerald-500 font-bold">MCQs:</span> Multiple choice questions (default: 12)</li>
                                    <li><span className="text-emerald-500 font-bold">Short Questions:</span> 2-mark questions (default: 15)</li>
                                    <li><span className="text-emerald-500 font-bold">Long Questions:</span> 10-mark questions (default: 3)</li>
                                </ul>
                                <p className="text-zinc-400 font-bold mt-3">For English papers, specify MCQ types:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Spelling questions</li>
                                    <li>Verb form questions</li>
                                    <li>Meaning/vocabulary questions</li>
                                    <li>Grammar questions</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step-4" className="border-white/5 bg-zinc-900/20 rounded-2xl px-6">
                        <AccordionTrigger className="text-sm font-bold hover:no-underline text-zinc-300">
                            Step 4: Generate & Customize
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-500 text-xs leading-relaxed font-medium pb-4 space-y-3">
                            <div className="space-y-2">
                                <p className="text-zinc-400 font-bold">After generation:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><span className="text-emerald-500 font-bold">View:</span> Preview the complete paper</li>
                                    <li><span className="text-emerald-500 font-bold">Edit in Architect:</span> Open advanced editor for customization</li>
                                    <li><span className="text-emerald-500 font-bold">Download PDF:</span> Save print-ready version</li>
                                    <li><span className="text-emerald-500 font-bold">Regenerate:</span> Create new version with same settings</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </section>

            {/* Paper Architect Section */}
            <section id="paper-architect" className="scroll-mt-32 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <Settings size={24} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Customization</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Paper Architect & Editor</h2>
                    <p className="text-zinc-400 leading-relaxed font-medium">
                        Advanced visual editor with 40+ customization options for complete control over paper appearance.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {[
                        { title: 'Page Settings', desc: 'Paper size (A4, Legal, Letter), margins, scaling, and themes', icon: FileText },
                        { title: 'Header Customization', desc: 'School name, logo, session details, and roll number format', icon: FileText },
                        { title: 'Watermarks', desc: 'Text or image watermarks with opacity, rotation, and positioning', icon: FileText },
                        { title: 'Section Styling', desc: 'Font, colors, backgrounds, borders, and spacing for each section', icon: Settings },
                        { title: 'Word-Level Editing', desc: 'Customize individual words with different colors and styles', icon: Settings },
                        { title: 'Floating Elements', desc: 'Add text, icons, and QR codes anywhere on the paper', icon: Sparkles },
                        { title: 'Section Reordering', desc: 'Drag and drop to rearrange paper sections', icon: Settings },
                        { title: 'Math Support', desc: 'LaTeX math rendering for equations and formulas', icon: Settings }
                    ].map((item, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/40 transition-colors space-y-2">
                            <div className="flex items-center gap-2">
                                <item.icon size={16} className="text-emerald-500" />
                                <h4 className="text-sm font-bold text-zinc-200">{item.title}</h4>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Student Records Section */}
            <section id="student-records" className="scroll-mt-32 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <Database size={24} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Data Management</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Student Records Management</h2>
                    <p className="text-zinc-400 leading-relaxed font-medium">
                        Comprehensive student data management with document vault and analytics.
                    </p>
                </div>

                <div className="grid gap-6">
                    <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4">Vault Tab</h3>
                        <div className="space-y-3 text-xs text-zinc-400">
                            <p>Store and organize past papers, notes, and study materials:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Upload PDF files and images</li>
                                <li>Tag documents (Notes, Guess Papers, Past Papers, Worksheets)</li>
                                <li>Search and filter by grade, year, and tags</li>
                                <li>Download and share documents</li>
                            </ul>
                        </div>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4">Students Tab</h3>
                        <div className="space-y-3 text-xs text-zinc-400">
                            <p>Manage student database:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Add, edit, and delete student records</li>
                                <li>Track fee status and payment history</li>
                                <li>Monitor performance ratings</li>
                                <li>View attendance records</li>
                                <li>Manage guardian contact information</li>
                            </ul>
                        </div>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4">AI Analytics Tab</h3>
                        <div className="space-y-3 text-xs text-zinc-400">
                            <p>Monitor AI paper generation usage:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Total papers generated statistics</li>
                                <li>Subject and grade distribution</li>
                                <li>Generation time metrics</li>
                                <li>User activity tracking</li>
                                <li>Export reports as CSV</li>
                            </ul>
                        </div>
                    </Card>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="scroll-mt-32 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <HelpCircle size={24} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Support</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Frequently Asked Questions</h2>
                </div>

                <Accordion className="w-full space-y-4">
                    {[
                        {
                            q: 'How long does paper generation take?',
                            a: 'Typically 30-60 seconds, depending on complexity and question count. The AI analyzes curriculum patterns and generates board-standard questions.'
                        },
                        {
                            q: 'Can I edit generated papers?',
                            a: 'Yes! Use the Paper Architect editor for full customization. You can modify text, change formatting, add watermarks, reorder sections, and more with 40+ options.'
                        },
                        {
                            q: 'What subjects are supported?',
                            a: 'English, Urdu, Mathematics, Biology, Chemistry, Physics, Computer Science, Islamiat, Pakistan Studies, and Tarjama-tul-Quran-ul-Majeed.'
                        },
                        {
                            q: 'How do I change my password?',
                            a: 'Go to Profile → Settings → Change Password. You\'ll need to enter your current password and then your new password twice.'
                        },
                        {
                            q: 'Can I generate papers for custom chapters?',
                            a: 'Yes, use the "Manual Chapter" option to type any chapter name. The AI will generate questions based on your input.'
                        },
                        {
                            q: 'What file formats are supported for upload?',
                            a: 'PDF, JPG, PNG, JPEG for documents. MP4 and YouTube links for videos. Maximum 10MB for images, 50MB for PDFs.'
                        }
                    ].map((item, idx) => (
                        <AccordionItem key={idx} value={`faq-${idx}`} className="border-white/5 bg-zinc-900/20 rounded-2xl px-6">
                            <AccordionTrigger className="text-sm font-bold hover:no-underline text-zinc-300">
                                {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-zinc-500 text-xs leading-relaxed font-medium pb-4">
                                {item.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>
        </div>
    )
}
