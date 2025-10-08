import { prepareInstructions } from 'constants/index';
import React, { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar'
import { convertPdfToImage } from '~/lib/pdf2img';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/utils';

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async({ companyName, jobTitle, jobDescription, file}: { companyName: string; jobTitle: string; jobDescription: string, file: File }) => {
    setIsProcessing(true);
    setStatusText('Uploading your resume...');
    
    const uploadedFile = await fs.upload([file]);

    if(!uploadedFile) {
      return setStatusText('Failed to upload file. Please try again.');
    }

    setStatusText('Converting to image...');
    const imageFile = await convertPdfToImage(file);

    setStatusText('Uploading the image...');
    if (!imageFile.file) {
      return setStatusText('Invalid image file. Please try again.');
    }
    
    const uploadedImage = await fs.upload([imageFile.file]);

    if(!uploadedImage) {
      return setStatusText('Failed to upload image. Please try again.');
    }

    setStatusText('Preparing data...');

    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadedFile?.path,
      imagePath: uploadedImage?.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: ''
    };

    await kv.set(`resume_${uuid}`, JSON.stringify(data));
    setStatusText('Analyzing with AI... This may take a few minutes.');

    const feedback = await ai.feedback(
      uploadedFile?.path!,
      prepareInstructions({ jobTitle, jobDescription })
    );

    if (!feedback) return setStatusText('Error: Failed to analyze resume');

    const feedbackText = typeof feedback.message.content === 'string'
      ? feedback.message.content
      : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    
    setStatusText('Analysis complete, redirecting...');
    navigate(`/resume/${uuid}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form : HTMLFormElement | null = event.currentTarget.closest('form');
    if(!form) return;

    const formData = new FormData(form);
    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if(!file) {
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });

  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className='page-heading py-16'>
          <h1>Smart feedback for your dream job</h1>
          {
            isProcessing ? (
              <>
                <h2>{statusText}</h2>
                <img src="/images/resume-scan.gif" alt="Resume GIF" className='w-full' />
              </>
            ) : (
              <h2>Drop your resume for ATS score and improvement tips</h2>
            )
          }
        </div>
        {
          !isProcessing && (
            <form 
              id='upload-form' 
              className='flex flex-col gap-4 mt-8'
              onSubmit={handleSubmit}
            >
              <div className='form-div'>
                <label htmlFor="company-name">Company Name</label>
                <input type="text" name="company-name" placeholder='Company Name' id='company-name' />
              </div>

              <div className='form-div'>
                <label htmlFor="job-title">Job Title</label>
                <input type="text" name="job-title" placeholder='Job Title' id='job-title' />
              </div>

              <div className='form-div'>
                <label htmlFor="job-description">Job Description</label>
                <textarea rows={5} name="job-description" placeholder='Job Title' id='job-description' />
              </div>

              <div className='form-div'>
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className='primary-button' type='submit'>
                Analyze Resume
              </button>
            </form>
          )
        }
      </section>
    </main>
  )
}

export default Upload