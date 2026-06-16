import React from 'react';
import { FileText, Calendar, CalendarCheck, ShieldCheck, Truck, Phone, Mail, Globe, MapPin } from 'lucide-react';
import potImg from '../assets/Picsart_26-06-12_00-14-40-385.png';
import logoImg from '../assets/logo-1.png';

/* SVG Assets */
/* Product Miniatures */
const KadhaiProductImg = ({ className = "mx-auto block h-16 w-auto" }) => (
  <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="160" height="100" fill="#CCCBC9" />
    <g transform="translate(0, 10)">
        <ellipse cx="80" cy="30" rx="42" ry="7" fill="#1B1C1D"/>
        <path d="M38 30 C 38 75, 122 75, 122 30 Z" fill="#3D3E42" />
        <path d="M38 30 C 38 75, 122 75, 122 30 Z" fill="url(#kadhai-texture)" />
        <ellipse cx="80" cy="30" rx="40" ry="6" fill="#1B1C1D" />
        <ellipse cx="80" cy="31" rx="36" ry="4" fill="#2B2D31" />
    </g>
    <defs>
      <pattern id="kadhai-texture" width="4" height="4" patternUnits="userSpaceOnUse">
         <circle cx="1" cy="1" r="0.5" fill="#fff" opacity="0.4"/>
         <circle cx="3" cy="2" r="0.5" fill="#111" opacity="0.3"/>
      </pattern>
    </defs>
  </svg>
);

const GardenReferenceImg = ({ className = "mx-auto block h-20 w-auto border border-gray-100" }) => (
  <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className={className}>
     <rect width="100" height="120" fill="#7ba362" /> 
     <rect width="100" height="60" fill="#b0aba1" /> 
     <rect x="10" y="10" width="20" height="50" fill="#908a82" />
     <rect x="35" y="5" width="25" height="55" fill="#807a72" />
     <rect x="65" y="15" width="25" height="45" fill="#757069" />
     <path d="M0 55 Q 50 40 100 65 L 100 120 L 0 120 Z" fill="#698e4d" />
     <path d="M0 65 Q 50 55 100 85 L 100 120 L 0 120 Z" fill="#82a567" />
     <path d="M0 80 Q 50 75 100 100 L 100 120 L 0 120 Z" fill="#698e4d" />
     <path d="M 15 40 Q 5 60 20 80 Q 35 60 25 40 Z" fill="#3B3D42" />
     <circle cx="20" cy="35" r="5" fill="#3B3D42" />
     <path d="M 85 35 Q 95 60 80 80 Q 65 60 75 35 Z" fill="#3B3D42" />
     <circle cx="80" cy="30" r="5" fill="#3B3D42" />
     <ellipse cx="50" cy="85" rx="18" ry="4" fill="#0d0e10" />
     <path d="M 32 85 C 32 105, 68 105, 68 85 Z" fill="#2d2f33" />
     <circle cx="50" cy="75" r="12" fill="#58a034" />
     <circle cx="42" cy="80" r="8" fill="#d1e046" />
     <circle cx="58" cy="80" r="8" fill="#d1e046" />
     <circle cx="45" cy="70" r="5" fill="#407823" />
     <circle cx="55" cy="70" r="5" fill="#407823" />
  </svg>
);

const BlackStone = ({ className = "mx-auto block h-12 w-12 rounded-full" }) => (
  <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <pattern id="black-speckles" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#181A19"/>
        <circle cx="2" cy="2" r="0.8" fill="#fff" opacity="0.9"/>
        <circle cx="8" cy="4" r="0.6" fill="#fff" opacity="0.7"/>
        <circle cx="4" cy="8" r="0.9" fill="#fff" opacity="0.8"/>
        <circle cx="7" cy="9" r="1.2" fill="#aaa" opacity="0.5"/>
        <circle cx="1" cy="7" r="0.7" fill="#666" opacity="0.7"/>
      </pattern>
    </defs>
    <circle cx="25" cy="25" r="25" fill="url(#black-speckles)" />
  </svg>
);

const BrownStone = ({ className = "mx-auto block h-12 w-12 rounded-full" }) => (
  <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <pattern id="brown-speckles" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#D3BAA6"/>
        <circle cx="2" cy="2" r="0.8" fill="#5c3a21" opacity="0.8"/>
        <circle cx="8" cy="4" r="0.6" fill="#4a2e19" opacity="0.6"/>
        <circle cx="4" cy="8" r="0.9" fill="#875836" opacity="0.7"/>
        <circle cx="7" cy="9" r="1.2" fill="#754b2d" opacity="0.5"/>
        <circle cx="1" cy="7" r="0.7" fill="#2d1b0e" opacity="0.7"/>
        <circle cx="5" cy="3" r="0.5" fill="#fff" opacity="0.4"/>
      </pattern>
    </defs>
    <circle cx="25" cy="25" r="25" fill="url(#brown-speckles)" />
  </svg>
);

export default function App() {
  return (
    <div className="w-[1000px] bg-page shadow-2xl relative overflow-hidden flex flex-col text-text-main">
      
      {/* Header Section */}
      <div className="flex relative h-[300px]">
        
        {/* Left Dark Panel Background */}
        <div 
          className="absolute left-0 top-0 h-full w-[42%] bg-dark z-0"
          style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)' }}
        ></div>

        {/* Left Dark Panel Content */}
        <div className="w-[28%] text-gold p-10 pr-8 flex flex-col items-center justify-center relative z-10">
          <img src={logoImg} alt="Neptune Logo" className="w-[193px] h-[69px] mb-8 object-contain brightness-0 invert opacity-90" />
          
          <div className="text-center font-serif text-[13.5px] italic text-[#9D7E6C] leading-snug">
            <p>Crafted Spaces.</p>
            <p>Timeless Design.</p>
          </div>
        </div>

        {/* The Overlapping Planter Image */}
        <div className="absolute left-[22%] top-4 z-20 pointer-events-none scale-90">
          <img src={potImg} alt="Planter" className="w-[240px] h-auto drop-shadow-2xl" />
        </div>

        {/* Right Light Area */}
        <div className="w-[72%] flex relative z-10">
          
          {/* Middle Title Area */}
          <div className="w-[55%] pt-14 pl-[120px] flex flex-col justify-start">
            <h2 className="font-serif text-[42px] text-[#1a1c1c] leading-none tracking-wide mb-3">QUOTATION</h2>
            <div className="flex items-center w-36 mb-6">
              <div className="w-8 h-[1px] bg-gold"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gold mx-1"></div>
              <div className="flex-1 h-[1px] bg-gold"></div>
            </div>
            
            <p className="text-[13px] leading-relaxed text-[#43474b] max-w-[200px]">
              Thank you for considering Neptune.<br/>
              We are pleased to submit our quotation<br/>
              as per your requirements.
            </p>
          </div>

          {/* Right Meta Info Area */}
          <div className="w-[45%] pt-14 pr-12 pl-4">
            <div className="flex flex-col gap-4 text-[11px] text-[#1a1c1c] border-l border-[#e2e2e2] pl-8 py-2 mt-2">
              <div className="flex items-start gap-4">
                <FileText className="w-4 h-4 text-gold mt-[-1px]" strokeWidth={1.5} />
                <div className="flex flex-1">
                  <span className="w-28 font-medium">Quotation No.</span>
                  <span>: &nbsp;QU001</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Calendar className="w-4 h-4 text-gold mt-[-1px]" strokeWidth={1.5} />
                <div className="flex flex-1">
                  <span className="w-28 font-medium">Date</span>
                  <span>: &nbsp;30/05/26</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CalendarCheck className="w-4 h-4 text-gold mt-[-1px]" strokeWidth={1.5} />
                <div className="flex flex-1">
                  <span className="w-28 font-medium">Valid Till</span>
                  <span>: &nbsp;13/06/26</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-4 h-4 text-gold mt-[-1px]" strokeWidth={1.5} />
                <div className="flex flex-1">
                  <span className="w-28 font-medium shrink-0">Payment Terms</span>
                  <span className="leading-tight whitespace-nowrap">: &nbsp;100% Advance</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Truck className="w-4 h-4 text-gold mt-[-1px]" strokeWidth={1.5} />
                <div className="flex flex-1">
                  <span className="w-28 font-medium">Delivery</span>
                  <span>: &nbsp;7 - 10 Days</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bill To & Ship To Section */}
      <div className="px-10 mt-6 mb-8 flex">
        <div className="w-[30%] pl-2">
          <div className="flex items-center mb-3">
            <h3 className="uppercase text-gold text-[10px] font-semibold tracking-[0.2em] mr-4">BILL TO</h3>
            <div className="w-10 h-[1.5px] bg-[#9D7E6C]"></div>
          </div>
          <h4 className="font-semibold text-[13px] text-[#192C27] mb-1">ABC Developers</h4>
          <p className="text-[12px] text-[#43474b] leading-[1.7]">
            Green Acres Villas,<br/>
            Bandra West,<br/>
            Mumbai - 400050<br/>
            Maharashtra, India
          </p>
          <p className="text-[11px] text-[#1a1c1c] mt-4 tracking-wide font-medium">GSTIN: 27ABCDE1234F1Z5</p>
        </div>
        
        <div className="w-[30%] pl-8 border-l border-[#9D7E6C]">
          <div className="flex items-center mb-3">
            <h3 className="uppercase text-gold text-[10px] font-semibold tracking-[0.2em] mr-4">SHIP TO</h3>
            <div className="w-10 h-[1.5px] bg-[#9D7E6C]"></div>
          </div>
          <h4 className="font-semibold text-[13px] text-[#192C27] mb-1">ABC Developers</h4>
          <p className="text-[12px] text-[#43474b] leading-[1.7]">
            Green Acres Villas,<br/>
            Bandra West,<br/>
            Mumbai - 400050<br/>
            Maharashtra, India
          </p>
        </div>
        
        <div className="w-[40%] flex items-center justify-end pl-4">
          <div className="text-center w-[95%] bg-[#F9F7F5] px-6 py-6 pb-5 rounded-sm">
            <span className="text-[#9D7E6C] text-[40px] font-serif leading-none block mb-1">“</span>
            <p className="font-serif text-[15px] leading-[1.6] text-[#1a1c1c]">
              We don't just make planters,<br/>
              we craft spaces that<br/>
              leave impressions.
            </p>
            <div className="w-6 h-[1.5px] bg-[#9D7E6C] mx-auto mt-4"></div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="px-8 mb-6 mt-2">
        <table className="w-full text-center border-collapse border-b border-[#e2e2e2]">
          <thead>
            <tr className="bg-dark text-gold text-[10px] uppercase font-bold tracking-[0.1em]">
              <th className="py-[16px] px-2 font-bold w-[7%]">SR. NO.</th>
              <th className="py-[16px] px-2 font-bold w-[12%]">PRODUCT</th>
              <th className="py-[16px] px-2 font-bold w-[6%]">QTY</th>
              <th className="py-[16px] px-2 font-bold w-[13%]">UNIT PRICE (₹)</th>
              <th className="py-[16px] px-2 font-bold w-[12%]">TOTAL (₹)</th>
              <th className="py-[16px] px-2 font-bold w-[18%]">PRODUCT IMG</th>
              <th className="py-[16px] px-2 font-bold w-[16%]">REFERENCE IMG</th>
              <th className="py-[16px] px-2 font-bold w-[16%]">STONE TEXTURE</th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-[#1a1c1c] align-middle">
            
            <tr className="bg-table-row border-b border-[#e2e2e2]">
              <td className="py-2 px-2 border-x border-[#e2e2e2] text-[14px]">1</td>
              <td className="py-2 px-2 border-x border-[#e2e2e2]">
                <div className="font-bold text-[13px] text-[#192C27] tracking-[0.05em] uppercase leading-tight mb-1 mt-1">KADHAI</div>
                <div className="text-[#74777c] font-medium text-[11px] uppercase pb-1">20×20</div>
              </td>
              <td className="py-2 px-2 border-x border-[#e2e2e2] text-[14px]">4</td>
              <td className="py-2 px-2 border-x border-[#e2e2e2] text-[14px]">2,000</td>
              <td className="py-2 px-2 border-x border-[#e2e2e2] text-[14px]">8,000</td>
              <td className="py-2 px-2 border-x border-[#e2e2e2]">
                <KadhaiProductImg className="mx-auto block h-[65px] w-auto max-w-[120px]" />
              </td>
              <td className="py-2 px-2 border-x border-[#e2e2e2]">
                <GardenReferenceImg className="mx-auto block h-[75px] w-auto" />
              </td>
              <td className="py-2 px-2 border-x border-[#e2e2e2]">
                <BlackStone className="mx-auto block h-[52px] w-[52px] rounded-full" />
              </td>
            </tr>

            <tr className="bg-table-row border-b border-[#e2e2e2]">
              <td className="py-2 px-2 border-x border-[#e2e2e2] text-[14px]">2</td>
              <td className="py-2 px-2 border-x border-[#e2e2e2]">
                <div className="font-bold text-[13px] text-[#192C27] tracking-[0.05em] uppercase leading-tight mb-1 mt-1">KADHAI</div>
                <div className="text-[#74777c] font-medium text-[11px] uppercase pb-1">40×40</div>
              </td>
              <td className="py-2 px-2 border-x border-[#e2e2e2] text-[14px]">1</td>
              <td className="py-2 px-2 border-x border-[#e2e2e2] text-[14px]">2,000</td>
              <td className="py-2 px-2 border-x border-[#e2e2e2] text-[14px]">2,000</td>
              <td className="py-2 px-2 border-x border-[#e2e2e2]">
                <KadhaiProductImg className="mx-auto block h-[65px] w-auto max-w-[120px]" />
              </td>
              <td className="py-2 px-2 border-x border-[#e2e2e2]">
                <GardenReferenceImg className="mx-auto block h-[75px] w-auto" />
              </td>
              <td className="py-2 px-2 border-x border-[#e2e2e2]">
                <BrownStone className="mx-auto block h-[52px] w-[52px] rounded-full" />
              </td>
            </tr>
            
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="px-8 flex">
        
        {/* Notes */}
        <div className="w-[33%] pr-4 pb-2">
          <div className="flex items-center mb-4">
            <h3 className="uppercase text-gold text-[11px] font-semibold tracking-wider mr-4">NOTES</h3>
            <div className="w-10 h-[1.5px] bg-[#9D7E6C]"></div>
          </div>
          <ul className="text-[11px] text-[#1a1c1c] leading-[1.6] space-y-[10px]">
            <li className="flex items-start">
              <span className="mr-2 mt-[6px] w-[3px] h-[3px] bg-[#43474b] rounded-full shrink-0"></span>
              <span>Transportation & installation extra as applicable.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-[6px] w-[3px] h-[3px] bg-[#43474b] rounded-full shrink-0"></span>
              <span>Goods once sold will not be taken back<br/>or exchanged.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-[6px] w-[3px] h-[3px] bg-[#43474b] rounded-full shrink-0"></span>
              <span>Delivery within 7-10 working days from<br/>the date of order.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-[6px] w-[3px] h-[3px] bg-[#43474b] rounded-full shrink-0"></span>
              <span>This quotation is valid for 15 days.</span>
            </li>
          </ul>
        </div>

        {/* Bank Details */}
        <div className="w-[33%] pl-8 border-l border-[#9D7E6C] pb-2">
          <div className="flex items-center mb-4">
            <h3 className="uppercase text-gold text-[11px] font-semibold tracking-wider mr-4">BANK DETAILS</h3>
            <div className="w-10 h-[1.5px] bg-[#9D7E6C]"></div>
          </div>
          <div className="text-[11px] text-[#1a1c1c] space-y-3">
            <div className="flex">
              <span className="w-[75px] font-medium text-[#43474b]">Bank Name</span><span className="mr-8 text-[#43474b]">:</span><span className="font-medium text-[#1a1c1c]">HDFC Bank</span>
            </div>
            <div className="flex">
              <span className="w-[75px] font-medium text-[#43474b]">A/C Name</span><span className="mr-8 text-[#43474b]">:</span><span className="font-medium text-[#1a1c1c]">Neptune Innovations</span>
            </div>
            <div className="flex">
              <span className="w-[75px] font-medium text-[#43474b]">A/C No.</span><span className="mr-8 text-[#43474b]">:</span><span className="font-medium text-[#1a1c1c]">50200067523491</span>
            </div>
            <div className="flex">
              <span className="w-[75px] font-medium text-[#43474b]">IFSC Code</span><span className="mr-8 text-[#43474b]">:</span><span className="font-medium text-[#1a1c1c]">HDFC0001234</span>
            </div>
            <div className="flex">
              <span className="w-[75px] font-medium text-[#43474b]">Branch</span><span className="mr-8 text-[#43474b]">:</span><span className="font-medium text-[#1a1c1c]">Hadapsar, Pune</span>
            </div>
          </div>
        </div>

        {/* Totals Box */}
        <div className="w-[34%] ml-auto bg-page flex flex-col">
          <div className="flex border border-[#e2e2e2] border-b-0 bg-[#F9F7F5]">
             <span className="px-5 py-4 uppercase text-[10px] tracking-widest text-[#43474b] w-1/2 border-r border-[#e2e2e2]">SUBTOTAL</span>
             <span className="px-5 py-4 text-right w-1/2 text-sm font-medium">₹ 10,000.00</span>
          </div>
          <div className="flex border border-[#e2e2e2] border-b-0 bg-[#F9F7F5]">
             <span className="px-5 py-4 uppercase text-[10px] tracking-widest text-[#43474b] w-1/2 border-r border-[#e2e2e2]">DISCOUNT %</span>
             <span className="px-5 py-4 text-right w-1/2 text-sm font-medium">₹ 1,800.00</span>
          </div>
          <div className="bg-dark text-white p-5 flex flex-col">
             <span className="uppercase text-[10px] tracking-widest text-gold mb-1">GRAND TOTAL</span>
             <span className="font-serif text-[32px] text-gold tracking-wide leading-none mb-2">₹ 11,800.00</span>
             <p className="text-[10px] text-[#c3c7cb] leading-snug">
               (Rupees Eleven Thousand Eight Hundred Only)
             </p>
          </div>
        </div>
      </div>

      {/* Pre-Footer Grid */}
      <div className="mx-10 mt-10 mb-8 pt-8 border-t border-[#e2e2e2] flex items-end justify-between">
        
        {/* Signature Area */}
        <div className="flex flex-col items-start relative w-[25%] pl-2">
           <span className="text-[10.5px] text-[#74777c] mb-1">Prepared By</span>
           <span className="text-[11.5px] text-[#1a1c1c] font-medium z-10 relative bg-page pr-2">Neptune Innovations</span>
           <div className="font-signature text-4xl text-[#192C27] mt-2 -ml-2 -mb-2 relative z-10 transform -rotate-2">
             Mamta
           </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center w-[40%] pb-[14px]">
           <p className="font-serif text-[15px] text-[#1a1c1c] leading-[1.6]">
             Thank you for your business.<br/>
             We look forward to being a part of<br/>
             your beautiful journey.
           </p>
           <div className="w-8 h-[1.5px] bg-[#9D7E6C] mx-auto mt-4"></div>
        </div>

        {/* QR Section */}
        <div className="w-[35%] flex justify-end items-center pr-2 pb-2">
           <div className="h-[60px] w-[1.5px] bg-[#9D7E6C] mr-5 opacity-40"></div>
           <div className="border border-[#9D7E6C] p-[3px] rounded-sm mr-5 shrink-0 bg-white">
             <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://shopneptune.in/products/&color=000&bgcolor=fff&margin=0" alt="QR Code" className="w-[52px] h-[52px] block" />
           </div>
           <div className="flex flex-col relative w-[130px] pt-1">
              <span className="text-[10px] font-medium tracking-[0.08em] pb-[2px] uppercase text-[#1a1c1c] leading-tight">SCAN TO VISIT</span>
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#1a1c1c] leading-tight">OUR COLLECTION</span>
              
              <svg className="w-[140px] h-5 text-[#9D7E6C] mt-2 block -ml-2" viewBox="0 0 140 20" fill="none" stroke="currentColor">
                 <path d="M2 16 L125 16 Q135 16, 137 5 M132 8 L137 5 L140 10" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
           </div>
        </div>
      </div>

      {/* Bottom Black Bar */}
      <div className="bg-dark text-gold px-12 py-[14px] flex items-center justify-between text-[11px] tracking-wide mt-auto">
         <div className="flex items-center gap-2">
            <Phone className="w-[14px] h-[14px]" strokeWidth={1.5} />
            <span>+91 97652 76111</span>
         </div>
         <div className="flex items-center gap-2 ml-4">
            <Mail className="w-[14px] h-[14px]" strokeWidth={1.5} />
            <span>connect@shopneptune.in</span>
         </div>
         <div className="flex items-center gap-2 ml-4">
            <Globe className="w-[14px] h-[14px]" strokeWidth={1.5} />
            <span>www.shopneptune.in</span>
         </div>
         <div className="flex items-center gap-3 max-w-[240px] leading-tight text-[10px]">
            <MapPin className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Sr No 34/1, Holkarwadi, Handewadi,<br/>Pune-412308</span>
         </div>
      </div>

    </div>
  );
}
