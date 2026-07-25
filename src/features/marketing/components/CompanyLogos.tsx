import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';

export function CompanyLogos() {
  const partners = [
    {
      name: 'Amazon',
      logo: (
        <svg
          className="h-8 md:h-10 w-28 md:w-36 flex-shrink-0"
          viewBox="0 0 603 182"
          aria-label="Amazon logo"
        >
          {/* Aligned Amazon wordmark text */}
          <text
            x="72"
            y="110"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="105"
            fontWeight="900"
            letterSpacing="-6px"
            className="fill-slate-900 dark:fill-white transition-colors duration-300"
          >
            amazon
          </text>
          {/* Official Amazon orange smile path */}
          <path
            fill="#ff9900"
            d="m 374.00642,142.18404 c -34.99948,25.79739 -85.72909,39.56123 -129.40634,39.56123 -61.24255,0 -116.37656,-22.65135 -158.08757,-60.32496 -3.2771,-2.96252 -0.34083,-6.9999 3.59171,-4.69283 45.01431,26.19064 100.67269,41.94697 158.16623,41.94697 38.774689,0 81.4295,-8.02237 120.6499,-24.67006 5.92501,-2.51683 10.87999,3.88009 5.08607,8.17965"
          />
          {/* Official Amazon orange arrowhead path */}
          <path
            fill="#ff9900"
            d="m 388.55678,125.53635 c -4.45688,-5.71527 -29.57261,-2.70033 -40.84585,-1.36327 -3.43442,0.41947 -3.95874,-2.56925 -0.86517,-4.71905 20.00346,-14.07844 52.82696,-10.01483 56.65462,-5.2958 3.82764,4.74526 -0.99624,37.64741 -19.79373,53.35128 -2.88385,2.41195 -5.63662,1.12734 -4.35198,-2.07113 4.2209,-10.53917 13.68519,-34.16054 9.20211,-39.90203"
          />
        </svg>
      ),
    },
    {
      name: 'Goldman Sachs',
      logo: (
        <svg className="h-8 md:h-10 w-44 md:w-56 flex-shrink-0" viewBox="0 0 180 28" aria-label="Goldman Sachs logo">
          <text
            x="90"
            y="19"
            textAnchor="middle"
            fontFamily="Playfair Display, Georgia, serif"
            fontSize="18"
            fontWeight="bold"
            letterSpacing="0.3px"
            className="fill-[#0A2240] dark:fill-slate-100 transition-colors duration-300"
          >
            Goldman Sachs
          </text>
        </svg>
      ),
    },
    {
      name: 'Adobe',
      logo: (
        <svg className="h-8 md:h-10 w-32 md:w-40 flex-shrink-0" viewBox="0 0 130 28" aria-label="Adobe logo">
          <rect x="0" y="2" width="24" height="24" fill="#FF0000" rx="4" />
          <path fill="#FFFFFF" d="M14.966 6H22v15.773zM10.034 6H2v15.773zM12 12.544l5.378 11.229h-3.415l-1.963-4.524H8.818L12 12.544z" />
          <text
            x="32"
            y="20"
            fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
            fontSize="17"
            fontWeight="bold"
            letterSpacing="-0.5px"
            className="fill-slate-900 dark:fill-white transition-colors duration-300"
          >
            Adobe
          </text>
        </svg>
      ),
    },
    {
      name: 'McKinsey',
      logo: (
        <svg className="h-8 md:h-10 w-44 md:w-56 flex-shrink-0" viewBox="0 0 180 28" aria-label="McKinsey logo">
          <text
            x="90"
            y="19"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="18"
            fontWeight="bold"
            fontStyle="italic"
            letterSpacing="0.2px"
            className="fill-[#002D62] dark:fill-slate-100 transition-colors duration-300"
          >
            McKinsey & Co.
          </text>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 border-y border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-900/40 transition-colors duration-300">
      <Container>
        <div className="flex flex-col space-y-10">
          <span className="text-xs sm:text-sm font-extrabold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest text-center">
            Securing interview match queues at global market leaders
          </span>
          
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 0.85, y: 0 }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex items-center justify-center cursor-pointer"
              >
                {partner.logo}
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
