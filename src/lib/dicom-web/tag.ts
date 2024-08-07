export enum DicomTag {
	ImageType = '00080008',
	SOPInstanceUID = '00080018',
	StudyDate = '00080020',
	StudyTime = '00080030',
	AccessionNumber = '00080050',
	Modality = '00080060',
	ModalitiesInStudy = '00080061',
	ReferencedSeriesSequence = '00081115',
	ReferencedInstanceSequence = '0008114A',
	ReferencedSOPInstanceUID = '00081155',
	PatientName = '00100010',
	PatientID = '00100020',
	PatientBirthDate = '00100030',
	PatientSex = '00100040',
	StudyInstanceUID = '0020000D',
	SeriesInstanceUID = '0020000E',
	StudyID = '00200010',
	SeriesNumber = '00200011',
	NumberOfFrames = '00280008',
	Rows = '00280010',
	Columns = '00280011',
	PixelSpacing = '00280030',
	PixelMeasuresSequence = '00289110',
	ContainerIdentifier = '00400512',
	TotalPixelMatrixColumns = '00480006',
	TotalPixelMatrixRows = '00480007',
	RecommendedDisplayCIELabValue = '0062000D',
	PointCoordinatesData = '00660016',
	LongPrimitivePointIndexList = '00660040',
	AnnotationGroupSequence = '006A0002',
	AnnotationGroupUID = '006A0003',
	AnnotationGroupLabel = '006A0005',
	NumberOfAnnotations = '006A000C',
	GraphicType = '00700023',
	SharedFunctionalGroupsSequence = '52009229',
}
