
import { Code2, BookOpen, Clock } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-base-100">
            {/* Hero Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                            Belajar <span className="text-primary">pemrograman</span>
                            <br />
                            secara mandiri
                        </h1>
                        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                            Platform pembelajaran mandiri yang dirancang untuk memudahkan Anda menguasai pemrograman tanpa batasan waktu dan biaya.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button className="btn btn-primary btn-lg rounded-full">
                            Mari Mulai
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="p-6 h-full bg-base-200">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Clock,
                                title: 'Fleksibel',
                                desc: 'Tentukan waktu belajarmu sendiri, kapan saja dan dimana saja sesuai dengan kecepatanmu.'
                            },
                            {
                                icon: Code2,
                                title: 'Praktis',
                                desc: 'Gunakan langsung di peramban Anda tanpa perlu instalasi aplikasi yang rumit.'
                            },
                            {
                                icon: BookOpen,
                                title: 'Gratis',
                                desc: 'Tidak dipungut biaya untuk semua orang.'
                            },
                        ].map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div key={i} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="card-body space-y-4">
                                        <div className="badge badge-primary badge-lg p-3 w-fit">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="card-title text-lg">{feature.title}</h3>
                                        <p className="text-base-content/70">{feature.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;