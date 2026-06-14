import { Inter, Playfair_Display } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import '../globals.css';
import { getDictionary } from '@/lib/dictionaries';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export async function generateMetadata({ params }) {
  const lang = (await params).lang || 'ro';

  if (lang === 'ru') {
    return {
      metadataBase: new URL('https://oglindaoglinjoara.md'),
      title: { default: 'Фотобудка & Видеоспиннер Видео 360 Кишинев Молдова | Oglinda Oglinjoara', template: '%s | Oglinda Oglinjoara' },
      description: 'Аренда премиум Селфи Зеркала (фотобудки) и видеоспиннера Video Booth 360 в Кишиневе и по всей Молдове. Мгновенная печать фотографий, веселый реквизит, подарок-альбом.',
      keywords: ['фотобудка молдова', 'видеоспиннер 360 кишинев', 'селфи зеркало молдова', 'аренда фотобудки кишинев', 'видеобудка молдова', 'video booth 360 chisinau', 'oglinda foto chisinau'],
      alternates: {
        canonical: `/ru`,
        languages: {
          'ro-MD': `/ro`,
          'ru-MD': `/ru`,
        }
      },
      robots: { index: true, follow: true }
    };
  }

  return {
    metadataBase: new URL('https://oglindaoglinjoara.md'),
    title: { default: 'Oglindă Foto & Platformă Video 360 Chișinău Moldova | Oglinda Oglinjoara', template: '%s | Oglinda Oglinjoara' },
    description: 'Chirie Oglindă Foto (Photo Booth) și Platformă Video 360 / Videobooth în Chișinău și toată Republica Moldova. Printare instantanee, accesorii premium, album cadou inclus.',
    keywords: ['oglinda foto moldova', 'chirie oglinda foto chisinau', 'video 360 moldova', 'videobooth chisinau', 'cabina foto moldova', 'oglinda oglinjoara', 'platforma 360 chisinau', 'oglinda foto pret', 'photo booth moldova'],
    alternates: {
      canonical: `/ro`,
      languages: {
        'ro-MD': `/ro`,
        'ru-MD': `/ru`,
      }
    },
    robots: { index: true, follow: true }
  };
}

export async function generateStaticParams() {
  return [{ lang: 'ro' }, { lang: 'ru' }];
}

export default async function RootLayout({ children, params }) {
  const lang = (await params).lang || 'ro';
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <Navbar dict={dict.navbar} lang={lang} />
        <main style={{paddingTop:'90px'}}>{children}</main>
        <Footer dict={dict.footer} />
      </body>
    </html>
  );
}
